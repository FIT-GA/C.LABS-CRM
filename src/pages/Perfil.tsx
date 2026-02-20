import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Camera, Loader2, Mail, Phone, User, Shield, BellDot } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNotifications } from "@/hooks/useNotifications";

export default function Perfil() {
  const { user, profile, role, signOut, updateProfile, uploadAvatar } = useAuth();
  const { enabled: notificationsEnabled, setEnabled: setNotificationsEnabled, requestPermission, permission, clearNotifications } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState([1]);
  const [cropX, setCropX] = useState([0]);
  const [cropY, setCropY] = useState([0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState(profile?.nome || "");
  const [telefone, setTelefone] = useState(profile?.telefone || "");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSave = async () => {
    setIsLoading(true);
    const { error } = await updateProfile({ nome, telefone });
    setIsLoading(false);

    if (error) {
      toast.error("Erro ao atualizar perfil");
    } else {
      toast.success("Perfil atualizado com sucesso!");
    }
  };

  const handleToggleNotifications = async (checked: boolean) => {
    if (!checked) {
      setNotificationsEnabled(false);
      clearNotifications();
      toast.message("Notificações desativadas");
      return;
    }
    // enabling
    const result = await requestPermission();
    if (result === "granted") {
      setNotificationsEnabled(true);
      toast.success("Notificações ativadas");
    } else {
      setNotificationsEnabled(false);
      toast.error("Ative permissões no navegador para receber notificações.");
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setCropZoom([1]);
    setCropX([0]);
    setCropY([0]);
    setCropOpen(true);
  };

  const loadImageFromFile = (file: File) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Não foi possível carregar a imagem selecionada."));
      };
      image.src = objectUrl;
    });

  const createCroppedAvatarFile = async (file: File, zoom: number, panX: number, panY: number) => {
    const image = await loadImageFromFile(file);
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível processar a imagem.");

    const baseScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
    const finalScale = baseScale * zoom;
    const drawWidth = image.naturalWidth * finalScale;
    const drawHeight = image.naturalHeight * finalScale;
    const centeredX = (size - drawWidth) / 2;
    const centeredY = (size - drawHeight) / 2;
    const maxShiftX = Math.max((drawWidth - size) / 2, 0);
    const maxShiftY = Math.max((drawHeight - size) / 2, 0);
    const offsetX = (panX / 100) * maxShiftX;
    const offsetY = (panY / 100) * maxShiftY;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, centeredX + offsetX, centeredY + offsetY, drawWidth, drawHeight);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );
    if (!blob) throw new Error("Não foi possível gerar a imagem recortada.");

    return new File([blob], "avatar.jpg", { type: "image/jpeg" });
  };

  const resetCropState = () => {
    setCropOpen(false);
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCropZoom([1]);
    setCropX([0]);
    setCropY([0]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropAndUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const croppedFile = await createCroppedAvatarFile(
        selectedFile,
        cropZoom[0] ?? 1,
        cropX[0] ?? 0,
        cropY[0] ?? 0
      );
      const { error } = await uploadAvatar(croppedFile);
      if (error) throw error;
      toast.success("Foto atualizada com sucesso!");
      resetCropState();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao recortar ou enviar a foto");
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const effectiveRole = role || profile?.nivel_acesso || "colaborador";

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais</p>
        </div>

        {/* Avatar Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Foto de Perfil
            </CardTitle>
            <CardDescription>Clique na foto para alterar</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="relative">
              <Avatar
                className="w-24 h-24 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleAvatarClick}
              >
                <AvatarImage className="object-cover" src={profile?.avatar_url || undefined} alt={profile?.nome} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {profile?.nome ? getInitials(profile.nome) : "U"}
                </AvatarFallback>
              </Avatar>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{profile?.nome || "Usuário"}</h3>
              <p className="text-muted-foreground">{user?.email}</p>
              <Badge variant={effectiveRole === "admin" || effectiveRole === "ceo" ? "default" : "secondary"} className="mt-2">
                <Shield className="w-3 h-3 mr-1" />
                {effectiveRole === "ceo"
                  ? "CEO"
                  : effectiveRole === "admin"
                  ? "Administrador"
                  : "Colaborador"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Dialog open={cropOpen} onOpenChange={(open) => !open && !isUploading ? resetCropState() : setCropOpen(open)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Ajustar foto de perfil</DialogTitle>
              <DialogDescription>
                Posicione e aproxime a imagem. O recorte será salvo em formato quadrado.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="mx-auto w-64 h-64 rounded-full overflow-hidden border-2 border-primary/40 bg-muted relative">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Pré-visualização"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{
                      transform: `translate(${cropX[0] ?? 0}%, ${cropY[0] ?? 0}%) scale(${cropZoom[0] ?? 1})`,
                      transformOrigin: "center",
                    }}
                  />
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Zoom</Label>
                  <Slider value={cropZoom} onValueChange={setCropZoom} min={1} max={3} step={0.01} />
                </div>
                <div className="space-y-1">
                  <Label>Ajuste horizontal</Label>
                  <Slider value={cropX} onValueChange={setCropX} min={-100} max={100} step={1} />
                </div>
                <div className="space-y-1">
                  <Label>Ajuste vertical</Label>
                  <Slider value={cropY} onValueChange={setCropY} min={-100} max={100} step={1} />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={resetCropState} disabled={isUploading}>
                Cancelar
              </Button>
              <Button onClick={handleCropAndUpload} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Aplicar recorte"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>Atualize seus dados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nome Completo
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefone
              </Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Nível de Acesso
              </Label>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium">
                  {effectiveRole === "ceo"
                    ? "CEO"
                    : effectiveRole === "admin"
                    ? "Administrador"
                    : "Colaborador"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {effectiveRole === "ceo" || effectiveRole === "admin"
                    ? "Você tem acesso total ao sistema, incluindo Dashboard, Clientes, Contratos, Financeiro e Demandas."
                    : "Você tem acesso às Tarefas e Demandas do sistema."}
                </p>
              </div>
            </div>

            <div className="flex gap-3 w-full mt-4">
              <Button onClick={handleSave} disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
              <Button variant="outline" className="w-36" onClick={signOut}>
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellDot className="w-5 h-5" />
              Notificações
            </CardTitle>
            <CardDescription>Controle o recebimento de alertas do app</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-foreground font-medium">Alertas e lembretes</p>
              <p className="text-sm text-muted-foreground">
                Receba avisos de prazos e pagamentos. Status: {notificationsEnabled ? "ativado" : "desativado"} {permission !== "granted" && notificationsEnabled ? "(permita no navegador)" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={notificationsEnabled} onCheckedChange={handleToggleNotifications} />
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
