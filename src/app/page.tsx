const serverLayers = [
  {
    title: "application",
    description: "负责分析流程编排、任务调度与用例服务。",
  },
  {
    title: "domain",
    description: "负责数据契约、领域模型与评分规则落点。",
  },
  {
    title: "infrastructure",
    description: "负责 LLM 配置、日志、文件与后续数据库接入。",
  },
  {
    title: "interfaces",
    description: "负责 API Route、DTO 与协议适配。",
  },
];

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
              Single Project Architecture
            </span>
          </div>

          <div className="grid gap-8 md:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                Interview Agent Engineering Base
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
                程序员面试平台 MVP 工程骨架
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                当前仓库已经修正为单项目结构。前端页面放在
                <code className="mx-1 rounded bg-slate-100 px-2 py-1 text-sm">
                  src/app
                </code>
                ，后端代码统一落在
                <code className="mx-1 rounded bg-slate-100 px-2 py-1 text-sm">
                  src/server
                </code>
                ，数据库后续再接入。
              </p>
            </div>

            <div className="rounded-[28px] bg-slate-950 p-6 text-sm text-slate-100">
              <p className="text-slate-400">当前阶段</p>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="font-medium">已完成</p>
                  <p className="text-slate-400">Next.js 初始化与结构修正</p>
                </div>
                <div>
                  <p className="font-medium">进行中</p>
                  <p className="text-slate-400">后端基础骨架与配置落点</p>
                </div>
                <div>
                  <p className="font-medium">下一步</p>
                  <p className="text-slate-400">Session / Report / API 原型</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {serverLayers.map((layer) => (
            <article
              key={layer.title}
              className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"
            >
              <p className="text-sm text-slate-500">src/server</p>
              <h2 className="mt-3 text-xl font-semibold">{layer.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {layer.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
