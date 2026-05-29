import nextra from 'nextra';

const withNextra = nextra({
  search: {
    codeblocks: false,
  },
});

export default withNextra({
  output: 'export',
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@x-filter/core', '@x-filter/react', '@x-filter/antd', '@x-filter/shadcn'],
  trailingSlash: true,
  reactStrictMode: true,
});
