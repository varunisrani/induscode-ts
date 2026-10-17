"""Offline real-PTY regression for the built TUI (Linux/macOS; Python stdlib only)."""
import argparse
import fcntl
import json
import os
from pathlib import Path
import pty
import select
import shutil
import struct
import subprocess
import tempfile
import termios
import time


def run_case(root, output, node, mode, columns, rows):
    master, slave = pty.openpty()
    fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack('HHHH', rows, columns, 0, 0))
    home = output / 'home'
    home.mkdir(exist_ok=True)
    env = {**os.environ, 'HOME': str(home), 'TERM': 'xterm-256color',
           'INDUSAGI_REACT_HOST_ROOT': str(root)}
    child = subprocess.Popen([node, str(root / 'scripts/tui-pty-fixture.mjs'), mode],
                             stdin=slave, stdout=slave, stderr=slave, cwd=output, env=env)
    os.close(slave)
    captured = bytearray()

    def pump(duration):
        end = time.monotonic() + duration
        while time.monotonic() < end:
            ready, _, _ = select.select([master], [], [], min(0.05, max(0, end-time.monotonic())))
            if ready:
                try:
                    data = os.read(master, 65536)
                except OSError:
                    return
                if not data:
                    return
                captured.extend(data)

    def send(data):
        start = len(captured)
        os.write(master, data)
        pump(0.15)
        return bytes(captured[start:])

    survived_interrupt = None
    typed_clear_sequences = 0
    typed_sync_frames = []
    try:
        deadline = time.monotonic() + 15
        while time.monotonic() < deadline and '↵ send'.encode() not in captured and child.poll() is None:
            pump(0.1)
        assert '↵ send'.encode() in captured, 'TUI never rendered its input'
        pump(0.2)
        # Exercise SIGWINCH against the real mounted instance, then restore size.
        fcntl.ioctl(master, termios.TIOCSWINSZ, struct.pack('HHHH', rows, max(32, columns-10), 0, 0))
        child.send_signal(__import__('signal').SIGWINCH)
        pump(0.15)
        fcntl.ioctl(master, termios.TIOCSWINSZ, struct.pack('HHHH', rows, columns, 0, 0))
        child.send_signal(__import__('signal').SIGWINCH)
        pump(0.15)
        if mode == 'busy':
            send(b'\x03')
            survived_interrupt = child.poll() is None
            assert survived_interrupt, 'First Ctrl+C exited instead of interrupting'
        else:
            # Each printable key must update in place. A full-terminal clear here
            # is visibly perceived as flicker, especially through Windows SSH.
            for key in (b'a', b'b', '😀'.encode()):
                update = send(key)
                typed_clear_sequences += update.count(b'\x1b[2J')
                begins = update.count(b'\x1b[?2026h')
                ends = update.count(b'\x1b[?2026l')
                typed_sync_frames.append((begins, ends))
            assert typed_clear_sequences == 0, (
                f'typing triggered {typed_clear_sequences} full-screen clears'
            )
            assert all(begins > 0 and begins == ends for begins, ends in typed_sync_frames), (
                f'typing redraws were not atomically synchronized: {typed_sync_frames}'
            )
            send(b'\x7f')       # backspace removes the whole emoji
            send(b'\x1b[D')    # caret before b
            send(b'\x1b[3~')   # forward delete b
            send(b'\r')       # submit a
        send(b'\x03')
        send(b'\x03')
        deadline=time.monotonic()+5
        while child.poll() is None and time.monotonic()<deadline:
            pump(0.1)
        pump(0.1)
        assert child.poll() == 0, 'TUI did not exit cleanly after deliberate double Ctrl+C'
        text=captured.decode(errors='replace')
        payload=next(line.split('PTY_RESULT ', 1)[1] for line in text.splitlines() if 'PTY_RESULT ' in line)
        result=json.loads(payload)
        assert result['result']['clean'] is True, result
        assert result['rawMode'] is False, result
        if mode == 'busy':
            assert result['aborts'] == 1, result
        else:
            assert result['submissions'] == ['a'], result
        return {**result, 'columns':columns, 'rows':rows,
                'survived_interrupt':survived_interrupt,
                'typed_clear_sequences':typed_clear_sequences,
                'typed_sync_frames':typed_sync_frames}
    finally:
        if child.poll() is None:
            child.terminate()
        child.wait(timeout=3)
        os.close(master)
        (output / f'pty-{mode}-{columns}x{rows}.ansi').write_bytes(captured)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--output', default=None)
    args=parser.parse_args()
    root=Path(__file__).resolve().parents[1]
    output=Path(args.output) if args.output else Path(tempfile.mkdtemp(prefix='indus-tui-pty-'))
    output.mkdir(parents=True,exist_ok=True)
    node=shutil.which('node')
    if not node:
        raise SystemExit('node is required')
    results=[]
    for mode in ['busy','idle']:
        for columns, rows in [(80,24),(40,18),(120,40)]:
            results.append(run_case(root,output,node,mode,columns,rows))
            print(json.dumps(results[-1]),flush=True)
            (output/'pty-results.json').write_text(json.dumps(results,indent=2))
    print(f'PASS: {len(results)} real-PTY cases; evidence: {output}')


if __name__ == '__main__':
    main()
