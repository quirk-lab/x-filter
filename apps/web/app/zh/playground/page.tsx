import { PlaygroundWorkbench } from '../../../src/components/demos/playground-workbench';

export const metadata = {
  title: '演练场',
  description:
    '真实场景筛选演示 — Notion 风格数据库筛选、GitHub 风格搜索栏，以及适配器对比工作台。',
};

export default function Page() {
  return (
    <section className="page-section">
      <div className="content-shell">
        <div className="prose" style={{ marginBottom: '1.5rem' }}>
          <p className="eyebrow">交互演示</p>
          <h1>演练场</h1>
          <p className="lede">
            探索基于 X-Filter 构建的真实筛选 UI — Notion 风格数据库筛选、GitHub
            风格令牌搜索栏，以及适配器对比工作台。
          </p>
        </div>
        <PlaygroundWorkbench locale="zh" />
      </div>
    </section>
  );
}
