import { FilteredList } from '@x-filter/antd';
import { filterDefined } from '@x-filter/core';
import { useFilteredArray, useValidatedInput } from '@x-filter/react';
import { ValidatedInput } from '@x-filter/shadcn';

function App() {
  const { value, setValue, isValid } = useValidatedInput('');
  const testArray = [1, null, 2, undefined, 3, null, 4];
  const filtered = useFilteredArray(testArray);

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>🎮 X-Filter Playground</h1>
      <p>测试 Monorepo 包依赖链路</p>

      <div style={{ marginTop: '2rem' }}>
        <h2>📦 Core Package Test</h2>
        <p>原始数组: {JSON.stringify(testArray)}</p>
        <p>过滤后: {JSON.stringify(filterDefined(testArray))}</p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>⚛️ React Hooks Test</h2>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            输入验证 Hook:
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              style={{ marginLeft: '1rem', padding: '0.5rem' }}
            />
          </label>
          <span style={{ marginLeft: '1rem', color: isValid ? 'green' : 'red' }}>
            {isValid ? '✓ 有效' : '✗ 无效'}
          </span>
        </div>
        <p>过滤数组 Hook 结果: {JSON.stringify(filtered)}</p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>🎨 Shadcn Component Test</h2>
        <ValidatedInput
          placeholder="输入文本..."
          onChange={(val, valid) => console.log({ val, valid })}
        />
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>🐜 Ant Design Component Test</h2>
        <FilteredList
          items={testArray}
          renderItem={(item) => (
            <span
              style={{
                padding: '0.5rem',
                background: '#f0f0f0',
                margin: '0.25rem',
                display: 'inline-block',
              }}
            >
              {item}
            </span>
          )}
        />
      </div>

      <div
        style={{ marginTop: '2rem', padding: '1rem', background: '#e8f5e9', borderRadius: '4px' }}
      >
        <h3>✅ 依赖链路验证</h3>
        <ul>
          <li>✓ @x-filter/utils → @x-filter/core</li>
          <li>✓ @x-filter/core → @x-filter/react</li>
          <li>✓ @x-filter/react → @x-filter/shadcn</li>
          <li>✓ @x-filter/react → @x-filter/antd</li>
          <li>✓ All packages → playground</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
