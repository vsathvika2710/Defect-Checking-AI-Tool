import { createContext, useContext, useState, type ReactNode } from "react";
import type { Scenario, EconInputs } from "./econ";
import { DEFAULT_INPUTS } from "./econ";

interface SelectionState {
  inspectionId: string;
  setInspectionId: (id: string) => void;
  scenario: Scenario;
  setScenario: (s: Scenario) => void;
  econ: EconInputs;
  setEcon: (patch: Partial<EconInputs>) => void;
  highlightRec: number | null;
  setHighlightRec: (r: number | null) => void;
}

const Ctx = createContext<SelectionState | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [inspectionId, setInspectionId] = useState("88213");
  const [scenario, setScenario] = useState<Scenario>("base");
  const [econ, setEconState] = useState<EconInputs>(DEFAULT_INPUTS);
  const [highlightRec, setHighlightRec] = useState<number | null>(null);
  const setEcon = (patch: Partial<EconInputs>) => setEconState((e) => ({ ...e, ...patch }));
  return (
    <Ctx.Provider value={{ inspectionId, setInspectionId, scenario, setScenario, econ, setEcon, highlightRec, setHighlightRec }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSelection() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSelection outside provider");
  return v;
}
