import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Client, ClientFormData } from "@/types/client";
import { supabase } from "@/integrations/supabase/client";

interface ClientContextType {
  clients: Client[];
  loading: boolean;
  addClient: (data: ClientFormData) => Promise<void>;
  removeClient: (id: string) => Promise<void>;
  updateClient: (id: string, data: ClientFormData) => Promise<void>;
  totalFaturamento: number;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega clientes do Supabase
  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        const mapped =
          data?.map((c) => ({
            id: c.id,
            razaoSocial: c.razao_social,
            cnpj: c.cnpj,
            endereco: c.endereco || "",
            valorPago: Number(c.valor_pago || 0),
            recorrencia: c.recorrencia,
            responsavel: c.responsavel || "",
            contatoInterno: c.contato_interno || "",
            createdAt: new Date(c.created_at),
          })) || [];
        setClients(mapped);
      } catch (err) {
        console.error("Erro ao carregar clientes", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const addClient = async (data: ClientFormData) => {
    const { data: inserted, error } = await supabase
      .from("clients")
      .insert({
        razao_social: data.razaoSocial,
        cnpj: data.cnpj,
        endereco: data.endereco,
        valor_pago: data.valorPago,
        recorrencia: data.recorrencia,
        responsavel: data.responsavel,
        contato_interno: data.contatoInterno,
      })
      .select()
      .single();
    if (error) throw error;
    const mapped: Client = {
      id: inserted.id,
      razaoSocial: inserted.razao_social,
      cnpj: inserted.cnpj,
      endereco: inserted.endereco || "",
      valorPago: Number(inserted.valor_pago || 0),
      recorrencia: inserted.recorrencia,
      responsavel: inserted.responsavel || "",
      contatoInterno: inserted.contato_interno || "",
      createdAt: new Date(inserted.created_at),
    };
    setClients((prev) => [mapped, ...prev]);
  };

  const removeClient = async (id: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) throw error;
    setClients((prev) => prev.filter((client) => client.id !== id));
  };

  const updateClient = async (id: string, data: ClientFormData) => {
    const { data: updated, error } = await supabase
      .from("clients")
      .update({
        razao_social: data.razaoSocial,
        cnpj: data.cnpj,
        endereco: data.endereco,
        valor_pago: data.valorPago,
        recorrencia: data.recorrencia,
        responsavel: data.responsavel,
        contato_interno: data.contatoInterno,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    setClients((prev) =>
      prev.map((client) =>
        client.id === id
          ? {
              id: updated.id,
              razaoSocial: updated.razao_social,
              cnpj: updated.cnpj,
              endereco: updated.endereco || "",
              valorPago: Number(updated.valor_pago || 0),
              recorrencia: updated.recorrencia,
              responsavel: updated.responsavel || "",
              contatoInterno: updated.contato_interno || "",
              createdAt: new Date(updated.created_at),
            }
          : client
      )
    );
  };

  const totalFaturamento = clients.reduce((acc, client) => {
    const multiplier = {
      mensal: 1,
      trimestral: 1 / 3,
      semestral: 1 / 6,
      anual: 1 / 12,
    };
    return acc + client.valorPago * multiplier[client.recorrencia];
  }, 0);

  return (
    <ClientContext.Provider
      value={{ clients, loading, addClient, removeClient, updateClient, totalFaturamento }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClients() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error("useClients must be used within a ClientProvider");
  }
  return context;
}
