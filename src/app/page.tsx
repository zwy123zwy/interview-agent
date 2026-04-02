export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,_rgba(220,38,38,0.12),_transparent_30%),linear-gradient(180deg,#f6efe6_0%,#fffdf8_100%)] px-6 py-10 text-slate-900">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-between gap-10 rounded-[32px] border border-black/5 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-12">
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-red-600 px-3 py-1 font-medium text-white">
              MVP Workspace
            </span>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-slate-600">
              Next.js + TypeScript
            </span>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-slate-600">
              TypeORM Pending
            </span>
          </div>

          <div className="grid gap-8 md:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                Interview Agent Engineering Base
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
                程序员面试平台 MVP 初始化工程
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                当前已完成仓库初始化和 Next.js 基础工程搭建。后续任务将按阶段接入
                TypeORM、业务模块、LLM 配置与开发日志体系。
              </p>
            </div>

            <div className="rounded-[28px] bg-slate-950 p-6 text-sm text-slate-100">
              <p className="text-slate-400">当前任务</p>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="font-medium">任务 1</p>
                  <p className="text-slate-400">Next.js + TypeScript 基础工程</p>
                </div>
                <div>
                  <p className="font-medium">任务 2</p>
                  <p className="text-slate-400">TypeORM 数据层骨架</p>
                </div>
                <div>
                  <p className="font-medium">任务 3</p>
                  <p className="text-slate-400">模块划分与环境配置</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">设计文档</p>
            <h2 className="mt-3 text-xl font-semibold">规格方案已入库</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              根目录保留产品设计与技术方案文档，作为后续代码生成和模块实现依据。
            </p>
          </article>

          <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">日志机制</p>
            <h2 className="mt-3 text-xl font-semibold">按日期记录变更</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              每完成一个任务，追加一份开发日志，记录模块范围、修改文件和后续动作。
            </p>
          </article>

          <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">下一步</p>
            <h2 className="mt-3 text-xl font-semibold">接入 TypeORM</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              下一任务会补数据库配置、实体目录、DataSource 和环境变量模板。
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
