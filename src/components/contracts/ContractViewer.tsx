import { Contract, contractStatusOptions } from "@/types/contract";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Copy, Printer, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ContractViewerProps {
  contract: Contract | null;
  open: boolean;
  onClose: () => void;
}

export function ContractViewer({ contract, open, onClose }: ContractViewerProps) {
  const { toast } = useToast();

  if (!contract) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const recorrenciaLabel: Record<string, string> = {
    unico: "Pagamento Único",
    mensal: "Mensal",
    trimestral: "Trimestral",
    semestral: "Semestral",
    anual: "Anual",
  };

  const statusInfo = contractStatusOptions.find((s) => s.value === contract.status);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(contract.conteudo);
    toast({
      title: "Copiado!",
      description: "Contrato copiado para a área de transferência.",
    });
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${contract.titulo}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
              pre { white-space: pre-wrap; font-family: inherit; }
            </style>
          </head>
          <body>
            <pre>${contract.conteudo}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-primary flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {contract.titulo}
          </DialogTitle>
        </DialogHeader>

        {/* Info Header */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-secondary/30">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Cliente</p>
            <p className="font-medium text-foreground text-sm">{contract.clientName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Valor</p>
            <p className="font-semibold text-primary">{formatCurrency(contract.valorContrato)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Recorrência</p>
            <p className="font-medium text-foreground text-sm">{recorrenciaLabel[contract.recorrencia]}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Status</p>
            <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusInfo?.color)}>
              {statusInfo?.label}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Vigência: {format(new Date(contract.dataInicio), "dd/MM/yyyy", { locale: ptBR })}
            {contract.dataFim && (
              <> até {format(new Date(contract.dataFim), "dd/MM/yyyy", { locale: ptBR })}</>
            )}
          </span>
          <span>
            Criado em: {format(new Date(contract.createdAt), "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>

        {/* Contract Content */}
        <div className="p-6 rounded-lg bg-secondary/20 border border-border">
          <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
            {contract.conteudo}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
