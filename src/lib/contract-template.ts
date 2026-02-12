import { Client } from "@/types/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContractData {
  valorContrato: number;
  recorrencia: string;
  dataInicio: Date;
  dataFim: Date | null;
  servico?: string;
  diaVencimento?: number;
  cidade?: string;
}

const recorrenciaLabels: Record<string, string> = {
  unico: "pagamento único",
  mensal: "mensal",
  trimestral: "trimestral",
  semestral: "semestral",
  anual: "anual",
};

function numberToWords(num: number): string {
  const units = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const hundreds = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  if (num === 0) return "zero";
  if (num === 100) return "cem";

  let result = "";

  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    if (thousands === 1) {
      result += "mil";
    } else {
      result += numberToWords(thousands) + " mil";
    }
    num %= 1000;
    if (num > 0) result += " e ";
  }

  if (num >= 100) {
    result += hundreds[Math.floor(num / 100)];
    num %= 100;
    if (num > 0) result += " e ";
  }

  if (num >= 20) {
    result += tens[Math.floor(num / 10)];
    num %= 10;
    if (num > 0) result += " e ";
  }

  if (num >= 10) {
    result += teens[num - 10];
    num = 0;
  }

  if (num > 0) {
    result += units[num];
  }

  return result.trim();
}

function formatCurrencyWords(value: number): string {
  const reais = Math.floor(value);
  const centavos = Math.round((value - reais) * 100);

  let result = "";

  if (reais > 0) {
    result = numberToWords(reais) + (reais === 1 ? " real" : " reais");
  }

  if (centavos > 0) {
    if (result) result += " e ";
    result += numberToWords(centavos) + (centavos === 1 ? " centavo" : " centavos");
  }

  return result || "zero reais";
}

export function fillContractTemplate(
  template: string,
  client: Client | null,
  contractData: ContractData
): string {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const replacements: Record<string, string> = {
    "{{RAZAO_SOCIAL}}": client?.razaoSocial || "[RAZÃO SOCIAL]",
    "{{CNPJ}}": client?.cnpj || "[CNPJ]",
    "{{ENDERECO}}": client?.endereco || "[ENDEREÇO]",
    "{{RESPONSAVEL}}": client?.responsavel || "[RESPONSÁVEL]",
    "{{CONTATO}}": client?.contatoInterno || "[CONTATO]",
    "{{VALOR}}": formatCurrency(contractData.valorContrato),
    "{{VALOR_EXTENSO}}": formatCurrencyWords(contractData.valorContrato),
    "{{RECORRENCIA}}": recorrenciaLabels[contractData.recorrencia] || contractData.recorrencia,
    "{{DATA_INICIO}}": format(contractData.dataInicio, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
    "{{DATA_FIM}}": contractData.dataFim 
      ? format(contractData.dataFim, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) 
      : "[DATA DE TÉRMINO]",
    "{{SERVICO}}": contractData.servico || "[DESCRIÇÃO DO SERVIÇO]",
    "{{DIA_VENCIMENTO}}": String(contractData.diaVencimento || 10),
    "{{CIDADE}}": contractData.cidade || "[CIDADE]",
    "{{DATA_ATUAL}}": format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
  };

  let filledTemplate = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    filledTemplate = filledTemplate.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value);
  }

  return filledTemplate;
}

export function getAvailablePlaceholders(): { key: string; description: string }[] {
  return [
    { key: "{{RAZAO_SOCIAL}}", description: "Razão social do cliente" },
    { key: "{{CNPJ}}", description: "CNPJ do cliente" },
    { key: "{{ENDERECO}}", description: "Endereço do cliente" },
    { key: "{{RESPONSAVEL}}", description: "Nome do responsável" },
    { key: "{{CONTATO}}", description: "Contato do cliente" },
    { key: "{{VALOR}}", description: "Valor do contrato formatado" },
    { key: "{{VALOR_EXTENSO}}", description: "Valor por extenso" },
    { key: "{{RECORRENCIA}}", description: "Tipo de recorrência" },
    { key: "{{DATA_INICIO}}", description: "Data de início" },
    { key: "{{DATA_FIM}}", description: "Data de término" },
    { key: "{{SERVICO}}", description: "Descrição do serviço" },
    { key: "{{DIA_VENCIMENTO}}", description: "Dia do vencimento" },
    { key: "{{CIDADE}}", description: "Cidade" },
    { key: "{{DATA_ATUAL}}", description: "Data atual" },
  ];
}
