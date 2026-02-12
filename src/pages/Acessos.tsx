import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Acessos() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpf, setCpf] = useState("");
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [nivel, setNivel] = useState<"admin" | "colaborador">("colaborador");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!email || !password || !cpf || !nome || !cargo) {
      toast.error("Preencha todos os campos.");
      setLoading(false);
      return;
    }
    const { error } = await signUp(email, password, nome, "", nivel);
    if (error) {
      toast.error(error.message || "Erro ao criar acesso.");
    } else {
      toast.success("Acesso criado com sucesso.");
      setEmail("");
      setPassword("");
      setCpf("");
      setNome("");
      setCargo("");
      setNivel("colaborador");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg">Criar acesso de colaborador</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>E-mail</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="colaborador@clabs.ag" />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={6} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Cargo / Squad" />
            </div>
            <div className="space-y-2">
              <Label>Nível de acesso</Label>
              <Select value={nivel} onValueChange={(v: "admin" | "colaborador") => setNivel(v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">CEO / Admin</SelectItem>
                  <SelectItem value="colaborador">Colaborador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? "Criando..." : "Criar acesso"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
