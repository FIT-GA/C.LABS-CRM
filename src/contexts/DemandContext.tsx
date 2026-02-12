import { createContext, useContext, useState, ReactNode } from "react";
import { Demand, DemandFormData, DemandStatus } from "@/types/demand";
import { useClients } from "./ClientContext";

interface DemandContextType {
  demands: Demand[];
  addDemand: (data: DemandFormData) => void;
  removeDemand: (id: string) => void;
  updateDemand: (id: string, data: Partial<DemandFormData>) => void;
  toggleTask: (demandId: string, taskId: string) => void;
  addTask: (demandId: string, titulo: string) => void;
  getDemandsByStatus: (status: DemandStatus) => Demand[];
}

const DemandContext = createContext<DemandContextType | undefined>(undefined);

// Dados zerados para novo ciclo
const initialDemands: Demand[] = [];

export function DemandProvider({ children }: { children: ReactNode }) {
  const [demands, setDemands] = useState<Demand[]>(initialDemands);
  const { clients } = useClients();

  const addDemand = (data: DemandFormData) => {
    const client = clients.find((c) => c.id === data.clientId);
    const newDemand: Demand = {
      id: crypto.randomUUID(),
      clientId: data.clientId,
      clientName: client?.razaoSocial || "Cliente não encontrado",
      demanda: data.demanda,
      descricao: data.descricao,
      dataPedido: data.dataPedido,
      dataEntrega: data.dataEntrega,
      responsavel: data.responsavel,
      status: data.status,
      tarefas: data.tarefas || [],
      createdAt: new Date(),
    };
    setDemands((prev) => [...prev, newDemand]);
  };

  const removeDemand = (id: string) => setDemands((prev) => prev.filter((d) => d.id !== id));

  const updateDemand = (id: string, data: Partial<DemandFormData>) => {
    setDemands((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, ...data, clientName: data.clientId ? (clients.find((c) => c.id === data.clientId)?.razaoSocial || d.clientName) : d.clientName }
          : d
      )
    );
  };

  const toggleTask = (demandId: string, taskId: string) => {
    setDemands((prev) =>
      prev.map((d) =>
        d.id === demandId
          ? { ...d, tarefas: d.tarefas.map((t) => (t.id === taskId ? { ...t, concluida: !t.concluida } : t)) }
          : d
      )
    );
  };

  const addTask = (demandId: string, titulo: string) => {
    setDemands((prev) =>
      prev.map((d) =>
        d.id === demandId
          ? { ...d, tarefas: [...d.tarefas, { id: crypto.randomUUID(), titulo, concluida: false }] }
          : d
      )
    );
  };

  const getDemandsByStatus = (status: DemandStatus) => demands.filter((d) => d.status === status);

  return (
    <DemandContext.Provider
      value={{ demands, addDemand, removeDemand, updateDemand, toggleTask, addTask, getDemandsByStatus }}
    >
      {children}
    </DemandContext.Provider>
  );
}

export function useDemands() {
  const context = useContext(DemandContext);
  if (!context) throw new Error("useDemands must be used within a DemandProvider");
  return context;
}