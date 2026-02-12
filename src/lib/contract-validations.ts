import { z } from "zod";

export const contractSchema = z.object({
  clientId: z.string().min(1, "Selecione um cliente"),
  titulo: z
    .string()
    .trim()
    .min(3, "Título deve ter no mínimo 3 caracteres")
    .max(200, "Título deve ter no máximo 200 caracteres"),
  valorContrato: z
    .number({ invalid_type_error: "Valor deve ser um número" })
    .positive("Valor deve ser maior que zero")
    .max(100000000, "Valor muito alto"),
  recorrencia: z.enum(["unico", "mensal", "trimestral", "semestral", "anual"], {
    errorMap: () => ({ message: "Selecione uma recorrência válida" }),
  }),
  dataInicio: z.date({ required_error: "Data de início é obrigatória" }),
  dataFim: z.date().nullable(),
  status: z.enum(["ativo", "pendente", "encerrado", "cancelado"]),
  conteudo: z
    .string()
    .trim()
    .min(50, "Conteúdo do contrato deve ter no mínimo 50 caracteres"),
});

export type ContractSchemaType = z.infer<typeof contractSchema>;
