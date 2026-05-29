import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';

type MDXComponentProps = {
  children?: ReactNode;
  className?: string;
  href?: string;
};

type MDXComponents = Record<string, ComponentType<MDXComponentProps> | keyof JSX.IntrinsicElements>;

function MdxLink({ children, href = '', ...props }: MDXComponentProps) {
  if (href.startsWith('http')) {
    return (
      <a href={href} rel="noreferrer" target="_blank" {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}

function Pre({ children, ...props }: MDXComponentProps) {
  return (
    <pre className="mdx-codeblock" {...props}>
      {children}
    </pre>
  );
}

function Code({ children, ...props }: MDXComponentProps) {
  return <code {...props}>{children}</code>;
}

export function useMDXComponents(components: MDXComponents = {}): MDXComponents {
  return {
    a: MdxLink,
    pre: Pre,
    code: Code,
    ...components,
  };
}
