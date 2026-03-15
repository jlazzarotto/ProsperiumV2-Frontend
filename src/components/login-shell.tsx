"use client";

import LoginPage from "@/components/Login-form";
import LogoDarkTheme from "../app/assets/img/Logo-branco.png";
import Image from "next/image";
import { ModeToggle } from "@/components/ModeToggle";
import { Anchor, BarChart3, Shield, Zap } from "lucide-react";

export function LoginShell() {
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWMkgydjJoMzR6TTM2IDIydi0ySDB2MmgzNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/25 rounded-full blur-3xl" />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-blue-300/15 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 backdrop-blur-sm rounded-xl">
              <Image
                src={LogoDarkTheme}
                alt="Prosperium Logo"
                style={{ width: "auto", height: 32 }}
                className="rounded"
                priority
              />
            </div>
            <span className="text-2xl font-light text-white/90 tracking-tight">
              Prosperium
            </span>
          </div>

          <div className="max-w-lg">
            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              Gestão financeira
              <br />
              <span className="text-blue-200">inteligente</span>
            </h1>
            <p className="text-lg text-blue-100/80 leading-relaxed mb-10">
              Controle seus lançamentos, operações e fluxo de caixa com uma plataforma moderna e completa.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="p-2 bg-white/15 rounded-lg shrink-0">
                  <BarChart3 className="h-5 w-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-0.5">Dashboard</h3>
                  <p className="text-xs text-blue-200/70">Visão completa em tempo real</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="p-2 bg-white/15 rounded-lg shrink-0">
                  <Anchor className="h-5 w-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-0.5">Operações</h3>
                  <p className="text-xs text-blue-200/70">Gestão portuária completa</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="p-2 bg-white/15 rounded-lg shrink-0">
                  <Zap className="h-5 w-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-0.5">Automação</h3>
                  <p className="text-xs text-blue-200/70">Recorrências e relatórios</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="p-2 bg-white/15 rounded-lg shrink-0">
                  <Shield className="h-5 w-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-0.5">Segurança</h3>
                  <p className="text-xs text-blue-200/70">Multi-tenant e auditoria</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-px bg-white/30" />
            <p className="text-sm text-blue-200/60 italic">
              Prosperidade através da tecnologia
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[45%] flex flex-col relative bg-white dark:bg-slate-900">
        <div className="absolute top-6 right-6 z-50">
          <ModeToggle />
        </div>

        <div className="lg:hidden flex items-center gap-2.5 self-center pt-10">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Image
              src={LogoDarkTheme}
              alt="Prosperium Logo"
              style={{ width: "auto", height: 28 }}
              className="rounded"
              priority
            />
          </div>
          <span className="text-xl font-light bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            Prosperium
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-sm">
            <LoginPage />
          </div>
        </div>
      </div>
    </div>
  );
}
