import { PlaygroundWorkbench } from '../../../src/components/demos/playground-workbench';

export const metadata = {
  title: '演练场',
  description: '对比 X-Filter 适配器，并检查 JSON、DSL、SQL 和校验输出。',
};

export default function Page() {
  return (
    <section className="page-section">
      <div className="content-shell">
        <div className="prose" style={{ marginBottom: '1.5rem' }}>
          <p className="eyebrow">交互演示</p>
          <h1>演练场</h1>
          <p className="lede">
            切换适配器、修改过滤器、加载嵌套或无效示例，并在没有后端的情况下检查所有生成输出。
          </p>
        </div>
        <PlaygroundWorkbench locale="zh" />
      </div>
    </section>
  );
}
