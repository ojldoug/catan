import type { ResourceType } from "../../game2/StaticTypes/ResourceTypes";

type Props = {
  title?: string;
  onSelect: (resource: ResourceType) => void;
  onClose?: () => void;
};

const RESOURCES: ResourceType[] = ["wood", "brick", "sheep", "wheat", "ore"];

export function MonopolySelect({ title = "Select a resource", onSelect, onClose }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={() => onClose?.()}
    >
      <div
        style={{
          background: "#111",
          border: "1px solid #333",
          borderRadius: 8,
          padding: 14,
          minWidth: 260,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontWeight: 700, marginBottom: 10 }}>{title}</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {RESOURCES.map((r) => (
            <button
              key={r}
              onClick={() => onSelect(r)}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              {r}
            </button>
          ))}
        </div>

        {onClose && (
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              style={{ padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
