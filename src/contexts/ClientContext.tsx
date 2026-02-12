import { createContext, useContext, useState, ReactNode } from "react";
import { Client, ClientFormData } from "@/types/client";

interface ClientContextType {
  clients: Client[];
  addClient: (data: ClientFormData) => void;
  removeClient: (id: string) => void;
  updateClient: (id: string, data: ClientFormData) => void;
  totalFaturamento: number;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

// Dados zerados para novo ciclo
const initialClients: Client[] = [];

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(initialClients);

  const addClient = (data: ClientFormData) => {
    const newClient: Client = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setClients((prev) => [...prev, newClient]);
  };

  const removeClient = (id: string) => {
    setClients((prev) => prev.filter((client) => client.id !== id));
  };

  const updateClient = (id: string, data: ClientFormData) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === id ? { ...client, ...data } : client
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
      value={{ clients, addClient, removeClient, updateClient, totalFaturamento }}
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
