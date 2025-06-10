import type { Article } from '@/types';

let articles: Article[] = [
  {
    id: '1',
    title: 'Understanding Serverless Architecture',
    slug: 'understanding-serverless-architecture',
    content: `Serverless architecture is a way to build and run applications and services without having to manage infrastructure. Your application still runs on servers, but all the server management is done by AWS, Azure, or Google Cloud.

## Key Benefits
- **No server management:** You don't have to provision or maintain any servers.
- **Flexible scaling:** Your application can be scaled automatically or by adjusting its capacity through toggling the number of units.
- **Pay for value:** Pay only for what you use.
- **Automated high availability:** Serverless provides built-in availability and fault tolerance.

\`\`\`javascript
// Example of a serverless function
exports.handler = async (event) => {
  console.log("Event: ", event);
  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from Lambda!'),
  };
  return response;
};
\`\`\`
    `,
    tags: ['serverless', 'cloud', 'aws', 'lambda'],
    createdAt: new Date('2024-05-01T10:00:00Z').toISOString(),
    author: 'Jane Cloud',
    imageUrl: 'https://placehold.co/800x400.png',
    dataAiHint: 'cloud serverless',
    likes: 15,
    excerpt: 'Explore the fundamentals of serverless architecture, its benefits, and how it transforms application development.'
  },
  {
    id: '2',
    title: 'Getting Started with Kubernetes',
    slug: 'getting-started-with-kubernetes',
    content: `Kubernetes is an open-source system for automating deployment, scaling, and management of containerized applications.

### Core Concepts
* Pods
* Services
* Volumes
* Namespaces

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:latest
        ports:
        - containerPort: 80
\`\`\`

This is a basic Nginx deployment.
    `,
    tags: ['kubernetes', 'containers', 'devops', 'orchestration'],
    createdAt: new Date('2024-05-05T14:30:00Z').toISOString(),
    author: 'John Kube',
    imageUrl: 'https://placehold.co/800x400.png',
    dataAiHint: 'kubernetes containers',
    likes: 22,
    excerpt: 'A beginner-friendly guide to understanding Kubernetes and deploying your first containerized application.'
  },
  {
    id: '3',
    title: 'The Rise of Edge Computing',
    slug: 'the-rise-of-edge-computing',
    content: `Edge computing is a distributed computing paradigm that brings computation and data storage closer to the sources of data. This is expected to improve response times and save bandwidth.

\`\`\`python
# Simple Python example for an edge device
import time

def process_sensor_data(data):
    # Perform computation on sensor data
    print(f"Processing data: {data}")
    return data * 2

sensor_reading = 10
processed_reading = process_sensor_data(sensor_reading)
print(f"Processed reading: {processed_reading}")

\`\`\`
    `,
    tags: ['edge computing', 'iot', 'cloud', 'performance'],
    createdAt: new Date('2024-05-10T09:00:00Z').toISOString(),
    author: 'Alice Edge',
    imageUrl: 'https://placehold.co/800x400.png',
    dataAiHint: 'network edge',
    likes: 30,
    excerpt: 'Discover how edge computing is reshaping data processing and enabling new applications with lower latency.'
  },
];

export const getArticles = (): Article[] => articles;

export const getArticleBySlug = (slug: string): Article | undefined =>
  articles.find((article) => article.slug === slug);

export const addArticle = (article: Omit<Article, 'id' | 'createdAt' | 'likes'> & { id?: string }): Article => {
  const newArticle: Article = {
    id: article.id || Date.now().toString(),
    ...article,
    createdAt: new Date().toISOString(),
    likes: 0,
  };
  articles = [newArticle, ...articles];
  return newArticle;
};

export const updateArticle = (updatedArticle: Article): Article | undefined => {
  articles = articles.map((article) =>
    article.id === updatedArticle.id ? updatedArticle : article
  );
  return updatedArticle;
};

export const deleteArticle = (id: string): void => {
  articles = articles.filter((article) => article.id !== id);
};

// This function is a placeholder, actual AI search would be more complex
export const searchArticles = (query: string, tagsToSearch: string[], allArticles: Article[]): Article[] => {
  const lowerQuery = query.toLowerCase();
  return allArticles.filter(article => {
    const titleMatch = article.title.toLowerCase().includes(lowerQuery);
    const contentMatch = article.content.toLowerCase().includes(lowerQuery);
    const tagMatch = tagsToSearch.length === 0 || article.tags.some(tag => tagsToSearch.includes(tag.toLowerCase()));
    return (titleMatch || contentMatch) && tagMatch;
  });
};
