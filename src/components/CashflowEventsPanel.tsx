import { AppState, newId } from "../types";
import { Card, IconButton, NumberInput, TextInput } from "./ui";

export function CashflowEventsPanel({
  state,
  update,
}: {
  state: AppState;
  update: (patch: (d: AppState) => void) => void;
}) {
  const events = [...state.cashflowEvents].sort((a, b) => a.age - b.age);

  return (
    <Card title="一次性大筆收支">
      <p className="mb-3 text-xs text-slate-400">
        在特定年齡的一次性收入或支出（今日購買力）。正數＝流入（年終、繼承）；負數＝流出（買房頭期、生小孩）。
      </p>
      <div className="space-y-2">
        {events.map((ev) => (
          <div key={ev.id} className="grid grid-cols-12 items-center gap-2">
            <div className="col-span-5">
              <TextInput
                value={ev.label}
                placeholder="項目（買房頭期…）"
                onChange={(v) =>
                  update((d) => {
                    d.cashflowEvents.find((x) => x.id === ev.id)!.label = v;
                  })
                }
              />
            </div>
            <div className="col-span-2">
              <NumberInput
                value={ev.age}
                suffix="歲"
                onChange={(n) =>
                  update((d) => {
                    d.cashflowEvents.find((x) => x.id === ev.id)!.age = n;
                  })
                }
              />
            </div>
            <div className="col-span-4">
              <NumberInput
                value={ev.amount}
                step={100000}
                suffix="元"
                onChange={(n) =>
                  update((d) => {
                    d.cashflowEvents.find((x) => x.id === ev.id)!.amount = n;
                  })
                }
              />
            </div>
            <div className="col-span-1 flex justify-end">
              <IconButton
                title="刪除"
                onClick={() =>
                  update((d) => {
                    d.cashflowEvents = d.cashflowEvents.filter(
                      (x) => x.id !== ev.id,
                    );
                  })
                }
              >
                ✕
              </IconButton>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <p className="text-sm text-slate-400">尚未新增事件。</p>
        )}
      </div>
      <button
        onClick={() =>
          update((d) =>
            d.cashflowEvents.push({
              id: newId(),
              label: "",
              age: d.assumptions.currentAge + 5,
              amount: 0,
            }),
          )
        }
        className="mt-2 text-sm text-indigo-600 hover:underline"
      >
        + 新增事件
      </button>
    </Card>
  );
}
