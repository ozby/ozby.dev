export type Post = {
  readonly slug: string;
  readonly title: string;
  readonly date: string;
  readonly description: string;
  readonly html: string;
  readonly readTime: number;
  readonly published: boolean;
};

export type Project = {
  readonly slug: string;
  readonly name: string;
  readonly summary: string;
  readonly url: string;
  readonly tech: readonly string[];
  readonly demoUrl?: string;
  readonly screenshots?: readonly string[];
  readonly why: string;
};
