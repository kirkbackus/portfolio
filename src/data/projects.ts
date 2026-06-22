export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  githubUrl?: string;
  demoUrl?: string;
  featured?: boolean;
}

export const projects: Project[] = [
  {
    id: "1",
    title: "Distributed Task Scheduler",
    description: "A high-performance, fault-tolerant distributed cron-like system written in Go. Implements Raft consensus for leader election and a custom lock-free priority queue for task scheduling.",
    tags: ["Go", "gRPC", "Raft", "Redis", "Docker"],
    githubUrl: "https://github.com/kirkbackus/portfolio",
    demoUrl: "",
    featured: true
  },
  {
    id: "2",
    title: "LSM-Tree Key-Value Store",
    description: "An embedded key-value database engine implemented in Rust, optimized for write-heavy workloads. Supports crash recovery via write-ahead logging (WAL) and background compaction.",
    tags: ["Rust", "Storage Engines", "Database Systems", "Concurrency"],
    githubUrl: "https://github.com/kirkbackus/portfolio",
    demoUrl: "",
    featured: true
  },
  {
    id: "3",
    title: "Real-time Analytics Dashboard",
    description: "A serverless pipeline that ingests high-volume clickstream events and visualizes real-time metrics. Uses AWS Lambda, Kinesis Streams, and Next.js for client rendering.",
    tags: ["TypeScript", "Next.js", "AWS", "Terraform", "WebSockets"],
    githubUrl: "https://github.com/kirkbackus/portfolio",
    demoUrl: "",
    featured: true
  },
  {
    id: "4",
    title: "Compiler Frontend",
    description: "A recursive descent parser and lexer for a subset of the C programming language. Generates an Abstract Syntax Tree (AST) and performs static type checking.",
    tags: ["C++", "Compilers", "Parsing", "Algorithms"],
    githubUrl: "https://github.com/kirkbackus/portfolio",
    demoUrl: "",
    featured: false
  }
];
