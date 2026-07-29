/**
 * Session overlays — the transcript navigation dialogs.
 */
import { useEffect, useState } from "indusagi/react-host";
import { SessionDialog, TreeDialog, UserMessageDialog } from "indusagi/react-ink";
import { jsx } from "indusagi/react-host/jsx-runtime";
import type { OverlayGroupProps } from "./pickers.js";

function toSessionInfo(row: any) {
  const lastModified = row.lastModified ?? 0;
  return {
    id: row.id,
    path: row.path,
    name: row.name,
    modified: new Date(lastModified),
    lastModified,
    size: row.size,
    messageCount: row.messageCount,
    firstMessage: row.preview
  };
}

function SessionPicker(props: OverlayGroupProps) {
  const { services, closeModal } = props;
  const [sessions, setSessions] = useState<any[]>([]);
  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const rows = await services!.sessions.list();
        if (live) setSessions(rows.map(toSessionInfo));
      } catch {
        if (live) setSessions([]);
      }
    })();
    return () => {
      live = false;
    };
  }, [services]);
  const currentPath = services!.sessions.pathOf(services!.conductor.snapshot().head.sessionId);
  return jsx(SessionDialog, {
    currentSessions: sessions,
    currentSessionPath: currentPath,
    onSelect: async (session: any) => {
      try {
        await services!.conductor.resume(session.id);
      } catch {
        // ignore
      }
      closeModal();
    },
    onLoadAllSessions: async () => {
      try {
        const rows = await services!.sessions.list({ deep: true });
        const mapped = rows.map(toSessionInfo);
        setSessions(mapped);
        return mapped;
      } catch {
        return [];
      }
    },
    onDeleteSession: async (session: any) => {
      try {
        await services!.sessions.remove(session.id);
        setSessions((prev) => prev.filter((row) => row.id !== session.id));
      } catch {
        // ignore
      }
    },
    onRenameSession: async (session: any, name: string) => {
      try {
        await services!.sessions.rename(session.id, name);
        const rows = await services!.sessions.list();
        setSessions(rows.map(toSessionInfo));
      } catch {
        // ignore
      }
    },
    onClose: closeModal
  });
}

function BranchTree(props: OverlayGroupProps) {
  const { services, closeModal } = props;
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const sessionId = services!.conductor.snapshot().head.sessionId;
        const store = await services!.sessions.open(sessionId);
        if (store === null) {
          if (live) setItems([]);
          return;
        }
        const nodes = services!.sessions.tree(store).map((node: any) => ({
          id: node.id,
          label: node.label,
          depth: node.depth,
          isLeaf: node.isLeaf,
          isCurrent: node.isCurrent
        }));
        if (live) setItems(nodes);
      } catch {
        if (live) setItems([]);
      }
    })();
    return () => {
      live = false;
    };
  }, [services]);
  return jsx(TreeDialog, {
    items,
    onSelect: async (node: any) => {
      if (node.id !== null) {
        try {
          await services!.conductor.navigateTree(node.id);
          const info = await services!.conductor.codeRestoreInfo(node.id);
          if (info.canRestore) {
            await services!.conductor.restoreCode(node.id);
          }
        } catch {
          // ignore
        }
      }
      closeModal();
    },
    onClose: closeModal
  });
}

function PriorTurns(props: OverlayGroupProps) {
  const { services, closeModal } = props;
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const sessionId = services!.conductor.snapshot().head.sessionId;
        const store = await services!.sessions.open(sessionId);
        if (store === null) {
          if (live) setItems([]);
          return;
        }
        const turns = services!.sessions.priorTurns(store).map((turn: any) => ({
          entryId: turn.entryId,
          text: turn.text,
          preview: turn.preview
        }));
        if (live) setItems(turns);
      } catch {
        if (live) setItems([]);
      }
    })();
    return () => {
      live = false;
    };
  }, [services]);
  return jsx(UserMessageDialog, {
    items,
    onSelect: async (turn: any) => {
      try {
        await services!.conductor.fork(turn.entryId);
        const info = await services!.conductor.codeRestoreInfo(turn.entryId);
        if (info.canRestore) {
          await services!.conductor.restoreCode(turn.entryId);
        }
      } catch {
        // ignore
      }
      closeModal();
    },
    onClose: closeModal
  });
}

export function SessionOverlays(props: OverlayGroupProps) {
  const { modal, services, closeModal } = props;
  if (services === void 0) return null;
  switch (modal.kind) {
    case "sessions":
      return jsx(SessionPicker, { ...props, services, closeModal });
    case "tree":
      return jsx(BranchTree, { ...props, services, closeModal });
    case "userTurns":
      return jsx(PriorTurns, { ...props, services, closeModal });
    default:
      return null;
  }
}