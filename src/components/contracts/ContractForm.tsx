import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { contractSchema, ContractSchemaType } from "@/lib/contract-validations";
import { contractRecorrenciaOptions, contractStatusOptions, defaultContractTemplate } from "@/types/contract";
import { useClients } from "@/contexts/ClientContext";
import { fillContractTemplate, getAvailablePlaceholders } from "@/lib/contract-template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, FileText, Settings, Eye, Copy, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContractFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ContractSchemaType) => void;
  defaultValues?: ContractSchemaType;
  isEdit?: boolean;
}

export function ContractForm({
  open,
  onClose,
  onSubmit,
  defaultValues,
  isEdit = false,
}: ContractFormProps) {
  const { toast } = useToast();
  const { clients } = useClients();
  const [previewContent, setPreviewContent] = useState("");
  const [customFields, setCustomFields] = useState({
    servico: "",
    diaVencimento: 10,
    cidade: "",
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContractSchemaType>({
    resolver: zodResolver(contractSchema),
    defaultValues: defaultValues || {
      clientId: "",
      titulo: "",
      valorContrato: 0,
      recorrencia: "mensal",
      dataInicio: new Date(),
      dataFim: null,
      status: "pendente",
      conteudo: defaultContractTemplate,
    },
  });

  const watchedValues = watch();
  const selectedClient = clients.find((c) => c.id === watchedValues.clientId);

  // Update preview when values change
  useEffect(() => {
    if (watchedValues.conteudo) {
      const filled = fillContractTemplate(
        watchedValues.conteudo,
        selectedClient || null,
        {
          valorContrato: watchedValues.valorContrato || 0,
          recorrencia: watchedValues.recorrencia,
          dataInicio: watchedValues.dataInicio || new Date(),
          dataFim: watchedValues.dataFim,
          ...customFields,
        }
      );
      setPreviewContent(filled);
    }
  }, [watchedValues, selectedClient, customFields]);

  const handleFormSubmit = (data: ContractSchemaType) => {
    // Fill template with actual values before saving
    const filledContent = fillContractTemplate(
      data.conteudo,
      selectedClient || null,
      {
        valorContrato: data.valorContrato,
        recorrencia: data.recorrencia,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
        ...customFields,
      }
    );

    onSubmit({ ...data, conteudo: filledContent });
    toast({
      title: isEdit ? "Contrato atualizado!" : "Contrato criado!",
      description: `${data.titulo} foi ${isEdit ? "atualizado" : "criado"} com sucesso.`,
    });
    reset();
    onClose();
  };

  const insertPlaceholder = (placeholder: string) => {
    const currentContent = watchedValues.conteudo || "";
    setValue("conteudo", currentContent + placeholder);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(previewContent);
    toast({
      title: "Copiado!",
      description: "Contrato copiado para a área de transferência.",
    });
  };

  const placeholders = getAvailablePlaceholders();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-primary flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {isEdit ? "Editar Contrato" : "Novo Contrato"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-secondary">
              <TabsTrigger value="dados" className="gap-2">
                <Settings className="w-4 h-4" />
                Dados
              </TabsTrigger>
              <TabsTrigger value="template" className="gap-2">
                <FileText className="w-4 h-4" />
                Template
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="w-4 h-4" />
                Prévia
              </TabsTrigger>
            </TabsList>

            {/* TAB: Dados do Contrato */}
            <TabsContent value="dados" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cliente */}
                <div className="md:col-span-2 space-y-2">
                  <Label>Cliente *</Label>
                  <Select
                    value={watchedValues.clientId}
                    onValueChange={(value) => setValue("clientId", value)}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.razaoSocial} - {client.cnpj}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.clientId && (
                    <p className="text-sm text-destructive">{errors.clientId.message}</p>
                  )}
                </div>

                {/* Título */}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="titulo">Título do Contrato *</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: Contrato de Prestação de Serviços"
                    {...register("titulo")}
                    className="bg-secondary border-border"
                  />
                  {errors.titulo && (
                    <p className="text-sm text-destructive">{errors.titulo.message}</p>
                  )}
                </div>

                {/* Valor */}
                <div className="space-y-2">
                  <Label htmlFor="valorContrato">Valor do Contrato (R$) *</Label>
                  <Input
                    id="valorContrato"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    {...register("valorContrato", { valueAsNumber: true })}
                    className="bg-secondary border-border"
                  />
                  {errors.valorContrato && (
                    <p className="text-sm text-destructive">{errors.valorContrato.message}</p>
                  )}
                </div>

                {/* Recorrência */}
                <div className="space-y-2">
                  <Label>Recorrência *</Label>
                  <Select
                    value={watchedValues.recorrencia}
                    onValueChange={(value) =>
                      setValue("recorrencia", value as ContractSchemaType["recorrencia"])
                    }
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {contractRecorrenciaOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.recorrencia && (
                    <p className="text-sm text-destructive">{errors.recorrencia.message}</p>
                  )}
                </div>

                {/* Data Início */}
                <div className="space-y-2">
                  <Label>Data de Início *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-secondary border-border",
                          !watchedValues.dataInicio && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watchedValues.dataInicio
                          ? format(watchedValues.dataInicio, "dd/MM/yyyy", { locale: ptBR })
                          : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={watchedValues.dataInicio}
                        onSelect={(date) => date && setValue("dataInicio", date)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.dataInicio && (
                    <p className="text-sm text-destructive">{errors.dataInicio.message}</p>
                  )}
                </div>

                {/* Data Fim */}
                <div className="space-y-2">
                  <Label>Data de Término</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-secondary border-border",
                          !watchedValues.dataFim && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watchedValues.dataFim
                          ? format(watchedValues.dataFim, "dd/MM/yyyy", { locale: ptBR })
                          : "Indeterminado"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={watchedValues.dataFim || undefined}
                        onSelect={(date) => setValue("dataFim", date || null)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select
                    value={watchedValues.status}
                    onValueChange={(value) =>
                      setValue("status", value as ContractSchemaType["status"])
                    }
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {contractStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Campos Personalizados */}
                <div className="md:col-span-2 p-4 rounded-lg bg-secondary/50 space-y-4">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    Campos para o Template
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="servico">Descrição do Serviço</Label>
                      <Input
                        id="servico"
                        placeholder="Ex: Marketing Digital"
                        value={customFields.servico}
                        onChange={(e) =>
                          setCustomFields({ ...customFields, servico: e.target.value })
                        }
                        className="bg-card border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="diaVencimento">Dia de Vencimento</Label>
                      <Input
                        id="diaVencimento"
                        type="number"
                        min="1"
                        max="31"
                        value={customFields.diaVencimento}
                        onChange={(e) =>
                          setCustomFields({
                            ...customFields,
                            diaVencimento: parseInt(e.target.value) || 10,
                          })
                        }
                        className="bg-card border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        placeholder="Ex: São Paulo/SP"
                        value={customFields.cidade}
                        onChange={(e) =>
                          setCustomFields({ ...customFields, cidade: e.target.value })
                        }
                        className="bg-card border-border"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB: Template do Contrato */}
            <TabsContent value="template" className="space-y-4 mt-4">
              <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-secondary/50">
                <span className="text-sm text-muted-foreground mr-2">Inserir lacuna:</span>
                {placeholders.slice(0, 8).map((p) => (
                  <Button
                    key={p.key}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertPlaceholder(p.key)}
                    className="text-xs"
                    title={p.description}
                  >
                    {p.key.replace(/[{}]/g, "")}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="conteudo">Conteúdo do Contrato</Label>
                <Textarea
                  id="conteudo"
                  {...register("conteudo")}
                  className="min-h-[400px] font-mono text-sm bg-secondary border-border"
                  placeholder="Digite o contrato aqui..."
                />
                {errors.conteudo && (
                  <p className="text-sm text-destructive">{errors.conteudo.message}</p>
                )}
              </div>

              <div className="p-3 rounded-lg bg-primary/10 text-sm">
                <p className="text-primary font-medium mb-2">💡 Dica: Lacunas disponíveis</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-muted-foreground">
                  {placeholders.map((p) => (
                    <span key={p.key} className="text-xs">
                      <code className="text-primary">{p.key}</code> - {p.description}
                    </span>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB: Prévia do Contrato */}
            <TabsContent value="preview" className="space-y-4 mt-4">
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Contrato
                </Button>
              </div>
              <div className="p-6 rounded-lg bg-secondary/30 border border-border">
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
                  {previewContent}
                </pre>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? "Salvar Alterações" : "Criar Contrato"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
