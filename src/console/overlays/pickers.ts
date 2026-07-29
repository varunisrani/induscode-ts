/**
 * Picker overlays — the selection dialogs raised over the transcript.
 */
import { useEffect, useState } from "indusagi/react-host";
import { ScopedModelsDialog, ThemeDialog, type Model } from "indusagi/react-ink";
import { jsx } from "indusagi/react-host/jsx-runtime";
import type { ConsoleDispatch, InkThemeAdapter, ModalState, OverlayServices } from "../contract.js";
import { DEFAULT_SCHEME, isThemeScheme } from "../contract.js";
import { useAuthenticatedProviders } from "../auth-status.js";
import { isDeliveryMode, DELIVERY_MODES } from "../../settings/index.js";
import { THEME_SCHEMES } from "../theme/index.js";
import { ModelBoard, SettingsBoard } from "./boards.js";

const TOGGLE_VALUES = ["on", "off"];

function refToModel(ref: any): Model<any> {
  return {
    id: ref.id,
    name: ref.name,
    api: "",
    provider: ref.provider,
    baseUrl: "",
    reasoning: ref.reasoning,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 0,
    maxTokens: 0
  };
}

function listModels(services: OverlayServices): Model<any>[] {
  try {
    return services.conductor.availableModels().map(refToModel);
  } catch {
    return [];
  }
}

function ModelPicker(props: OverlayGroupProps) {
  const { services, theme, closeModal } = props;
  const authed = useAuthenticatedProviders(services);
  if (!services) return null;
  const all = listModels(services);
  const models = authed === null ? all : all.filter((model) => authed.has(model.provider));
  return jsx(ModelBoard, {
    theme,
    models,
    onSelect: (model: Model<any>) => {
      try {
        services.conductor.selectModel(model.id);
      } catch {
        // ignore
      }
      closeModal();
    },
    onClose: closeModal
  });
}

function readScopedPayload(payload: unknown): { focus?: string; intent?: string } {
  if (payload === null || typeof payload !== "object") return {};
  const record = payload as any;
  const out: any = {};
  if (record.focus === "summary") out.focus = "summary";
  if (record.intent === "reset") out.intent = "reset";
  return out;
}

function ScopedModelPicker(props: OverlayGroupProps) {
  const { services, dispatch, closeModal, modal } = props;
  const payload = readScopedPayload(modal.payload);
  useEffect(() => {
    if (!services || payload.intent !== "reset") return;
    try {
      services.settings.set("enabledModels", []);
      services.settings.save();
      dispatch({
        type: "status:set",
        status: { kind: "info", text: "Per-scope model overrides cleared." }
      });
    } catch {
      dispatch({
        type: "status:set",
        status: { kind: "error", text: "Could not clear per-scope model overrides." }
      });
    }
    closeModal();
  }, []);
  if (!services) return null;
  if (payload.intent === "reset") return null;
  const models = listModels(services);
  let enabled: string[] = [];
  try {
    enabled = services.settings.get("enabledModels");
  } catch {
    enabled = [];
  }
  const selectedIds = enabled.length > 0 ? enabled : models.map((model) => model.id);
  return jsx(ScopedModelsDialog, {
    models,
    selectedIds,
    onSave: (ids: string[]) => {
      try {
        const all = models.map((model) => model.id);
        const next = ids.length === all.length ? [] : ids;
        services.settings.set("enabledModels", next);
        services.settings.save();
      } catch {
        // ignore
      }
      closeModal();
    },
    onClose: closeModal
  });
}

function currentScheme(services: OverlayServices): string {
  try {
    const stored = services.settings.get("colourScheme");
    if (typeof stored === "string" && isThemeScheme(stored)) return stored;
  } catch {
    // ignore
  }
  return DEFAULT_SCHEME;
}

function ThemePicker(props: OverlayGroupProps) {
  const { services, dispatch, closeModal } = props;
  const [originalScheme] = useState(() => (services ? currentScheme(services) : null));
  if (!services) return null;
  const revert = () => {
    if (originalScheme) dispatch({ type: "scheme:set", scheme: originalScheme });
    closeModal();
  };
  return jsx(ThemeDialog, {
    themes: [...THEME_SCHEMES],
    onSelect: (name: string) => {
      if (isThemeScheme(name)) {
        dispatch({ type: "scheme:set", scheme: name });
        try {
          services.settings.set("colourScheme", name);
          services.settings.save();
        } catch {
          // ignore
        }
      }
      closeModal();
    },
    onClose: revert
  });
}

function SettingsPicker(props: OverlayGroupProps) {
  const { services, theme, dispatch, closeModal } = props;
  if (!services) return null;
  const settings = services.settings;
  const [, setVersion] = useState(0);
  const bump = () => setVersion((n) => n + 1);
  const onOff = (flag: boolean) => (flag ? "on" : "off");
  const toggleRow = (id: string, key: string, label: string, description: string, live?: () => void) => ({
    id,
    label,
    description,
    value: onOff(settings.get(key) as boolean),
    values: [...TOGGLE_VALUES],
    onChange: (value: string) => {
      settings.set(key, value === "on");
      settings.save();
      live?.();
      bump();
    }
  });
  const deliveryRow = (id: string, key: string, label: string, description: string) => ({
    id,
    label,
    description,
    value: settings.get(key) as string,
    values: [...DELIVERY_MODES],
    onChange: (value: string) => {
      if (isDeliveryMode(value)) {
        settings.set(key, value);
        settings.save();
      }
      bump();
    }
  });
  const items: any[] = [];
  try {
    items.push({
      id: "colour-scheme",
      label: "Colour scheme",
      description: "The terminal colour scheme the console renders in.",
      value: settings.get("colourScheme") as string,
      values: [...THEME_SCHEMES],
      onChange: (value: string) => {
        settings.set("colourScheme", value);
        settings.save();
        if (isThemeScheme(value)) dispatch({ type: "scheme:set", scheme: value });
        bump();
      }
    });
    items.push(toggleRow("show-images", "showImages", "Show images", "Render inline image content in the transcript.", () => dispatch({ type: "toggle:images" })));
    items.push(toggleRow("image-auto-resize", "imageAutoResize", "Auto-resize images", "Shrink oversized images to fit before handing them to a provider."));
    items.push(toggleRow("block-images", "blockImages", "Block images", "Withhold image content from providers entirely."));
    items.push(toggleRow("show-reasoning", "showReasoning", "Show reasoning", "Stream the model's reasoning / thinking text as it arrives.", () => dispatch({ type: "toggle:reasoning" })));
    items.push(toggleRow("skill-commands", "enableSkillCommands", "Skill commands", "Surface discovered skills as their own slash commands."));
    items.push(deliveryRow("steering-mode", "steeringMode", "Steering mode", "Whether queued steering corrections release one at a time or all at once."));
    items.push(deliveryRow("follow-up-mode", "followUpMode", "Follow-up mode", "Whether queued follow-up prompts release one at a time or all at once."));
    items.push(toggleRow("auto-compact", "autoCompact", "Auto-compact", "Condense the transcript automatically as it nears the window."));
    items.push(toggleRow("collapse-changelog", "collapseChangelog", "Collapse changelog", "Prefer a condensed changelog after the console updates itself."));
    items.push(toggleRow("quiet-startup", "quietStartup", "Quiet startup", "Suppress the banner and tips shown on a normal interactive launch."));
    items.push(toggleRow("logo-sweep", "logoSweep", "Logo sweep", "Tint the startup wordmark and emblem along a static colour gradient."));
    items.push(toggleRow("reduced-motion", "reducedMotion", "Reduced motion", "Suppress motion-flavoured flourishes such as the logo colour sweep."));
    items.push(toggleRow("hardware-cursor", "showHardwareCursor", "Hardware cursor", "Reveal the terminal's own cursor instead of the software-drawn caret."));
    items.push({
      id: "editor-padding",
      label: "Editor padding",
      description: "Horizontal padding, in columns, around the prompt editor.",
      value: String(settings.get("editorPaddingX")),
      values: ["0", "1", "2", "3"],
      onChange: (value: string) => {
        const parsed = Number.parseInt(value, 10);
        if (Number.isFinite(parsed)) {
          settings.set("editorPaddingX", parsed);
          settings.save();
        }
        bump();
      }
    });
  } catch {
    return null;
  }
  return jsx(SettingsBoard, { theme, items, onClose: closeModal });
}

/** The props every overlay group receives. */
export interface OverlayGroupProps {
  readonly modal: ModalState;
  readonly services?: OverlayServices;
  readonly theme: InkThemeAdapter;
  readonly dispatch: ConsoleDispatch;
  readonly closeModal: () => void;
}

export function PickerOverlays(props: OverlayGroupProps) {
  switch (props.modal.kind) {
    case "models":
      return jsx(ModelPicker, { ...props });
    case "scopedModels":
      return jsx(ScopedModelPicker, { ...props });
    case "theme":
      return jsx(ThemePicker, { ...props });
    case "settings":
      return jsx(SettingsPicker, { ...props });
    default:
      return null;
  }
}