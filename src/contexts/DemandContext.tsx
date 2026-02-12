import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Demand, DemandFormData, DemandStatus } from "@/types/demand";
import { useClients } from "./ClientContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface DemandContextType {
  demands: Demand[];
  loading: boolean;
  addDemand: (data: DemandFormData) => Promise<void>;
  removeDemand: (id: string) => Promise<void>;
  updateDemand: (id: string, data: Partial<DemandFormData>) => Promise<void>;
  toggleTask: (demandId: string, taskId: string) => Promise<void>;
  addTask: (demandId: string, titulo: string) => Promise<void>;
  getDemandsByStatus: (status: DemandStatus) => Demand[];
}

const DemandContext = createContext<DemandContextType | undefined>(undefined);

// Dados zerados para novo ciclo
const initialDemands: Demand[] = [];

export function DemandProvider({ children }: { children: ReactNode }) {
  const [demands, setDemands] = useState<Demand[]>(initialDemands);
  const [loading, setLoading] = useState(true);
  const { clients } = useClients();
  const { user } = useAuth();

  const mapDemand = (row: any): Demand => {
    const clientName = clients.find((c) => c.id === row.client_id)?.razaoSocial || row.client_name || "Cliente não encontrado";
    return {
      id: row.id,
      clientId: row.client_id || "",
      clientName,
      demanda: row.demanda,
      descricao: row.descricao || "",
      dataPedido: new Date(row.data_pedido),
      dataEntrega: new Date(row.data_entrega),
      responsavel: row.responsavel || "",
      status: row.status,
      prioridade: row.prioridade,
      tarefas:
        row.demand_tasks?.map((t: any) => ({
          id: t.id,
          titulo: t.titulo,
          concluida: t.concluida,
        })) || [],
      createdAt: new Date(row.created_at),
    };
  };

  const fetchDemands = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("demands")
        .select("*, demand_tasks(*)")
        .order("data_entrega", { ascending: true });

      if (error) throw error;
      const mapped = (data || []).map(mapDemand);
      setDemands(mapped);
    } catch (err) {
      console.error("Erro ao carregar demandas", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients.length]);

  const addDemand = async (data: DemandFormData) => {
    try {
      const payload = {
        client_id: data.clientId || null,
        demanda: data.demanda,
        descricao: data.descricao || "",
        data_pedido: data.dataPedido.toISOString().split("T")[0],
        data_entrega: data.dataEntrega.toISOString().split("T")[0],
        responsavel: data.responsavel,
        status: data.status,
        prioridade: data.prioridade,
        created_by: user?.id ?? null,
      };

      const { data: inserted, error } = await supabase
        .from("demands")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;

      if (data.tarefas && data.tarefas.length > 0 && inserted) {
        const tasksPayload = data.tarefas.map((t) => ({
          demand_id: inserted.id,
          titulo: t.titulo,
          concluida: t.concluida ?? false,
        }));
        const { error: taskError } = await supabase.from("demand_tasks").insert(tasksPayload);
        if (taskError) throw taskError;
      }

      await fetchDemands();
    } catch (err) {
      console.error("Erro ao criar demanda", err);
      throw err;
    }
  };

  const removeDemand = async (id: string) => {
    try {
      const { error } = await supabase.from("demands").delete().eq("id", id);
      if (error) throw error;
      setDemands((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Erro ao remover demanda", err);
      throw err;
    }
  };

  const updateDemand = async (id: string, data: Partial<DemandFormData>) => {
    try {
      const payload: any = {};
      if (data.clientId !== undefined) payload.client_id = data.clientId || null;
      if (data.demanda !== undefined) payload.demanda = data.demanda;
      if (data.descricao !== undefined) payload.descricao = data.descricao;
      if (data.dataPedido) payload.data_pedido = data.dataPedido.toISOString().split("T")[0];
      if (data.dataEntrega) payload.data_entrega = data.dataEntrega.toISOString().split("T")[0];
      if (data.responsavel !== undefined) payload.responsavel = data.responsavel;
      if (data.status !== undefined) payload.status = data.status;
      if (data.prioridade !== undefined) payload.prioridade = data.prioridade;

      if (Object.keys(payload).length > 0) {
        const { error } = await supabase.from("demands").update(payload).eq("id", id);
        if (error) throw error;
      }

      // Recria checklist para manter consistência
      if (data.tarefas) {
        await supabase.from("demand_tasks").delete().eq("demand_id", id);
        if (data.tarefas.length > 0) {
          const { error: taskError } = await supabase.from("demand_tasks").insert(
            data.tarefas.map((t) => ({
              demand_id: id,
              titulo: t.titulo,
              concluida: t.concluida ?? false,
            }))
          );
          if (taskError) throw taskError;
        }
      }

      await fetchDemands();
    } catch (err) {
      console.error("Erro ao atualizar demanda", err);
      throw err;
    }
  };

  const toggleTask = async (demandId: string, taskId: string) => {
    try {
      const demand = demands.find((d) => d.id === demandId);
      const task = demand?.tarefas.find((t) => t.id === taskId);
      const next = task ? !task.concluida : false;
      const { error } = await supabase.from("demand_tasks").update({ concluida: next }).eq("id", taskId);
      if (error) throw error;
      setDemands((prev) =>
        prev.map((d) =>
          d.id === demandId
            ? { ...d, tarefas: d.tarefas.map((t) => (t.id === taskId ? { ...t, concluida: next } : t)) }
            : d
        )
      );
    } catch (err) {
      console.error("Erro ao alternar tarefa", err);
      throw err;
    }
  };

  const addTask = async (demandId: string, titulo: string) => {
    try {
      const { data, error } = await supabase
        .from("demand_tasks")
        .insert({ demand_id: demandId, titulo, concluida: false })
        .select("*")
        .single();

      if (error) throw error;

      setDemands((prev) =>
        prev.map((d) =>
          d.id === demandId
            ? { ...d, tarefas: [...d.tarefas, { id: data.id, titulo: data.titulo, concluida: data.concluida }] }
            : d
        )
      );
    } catch (err) {
      console.error("Erro ao adicionar tarefa", err);
      throw err;
    }
  };

  const getDemandsByStatus = (status: DemandStatus) => demands.filter((d) => d.status === status);

  return (
    <DemandContext.Provider
      value={{ demands, loading, addDemand, removeDemand, updateDemand, toggleTask, addTask, getDemandsByStatus }}
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
