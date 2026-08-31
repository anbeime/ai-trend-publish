export interface AIGithubItem {
  itemId: string;
  author: string;
  title: string;
}

interface relatedUrl {
  url: string;
  title: string;
}

export interface AIGithubItemDetail extends AIGithubItem {
  name: string;

  url: string;
  description: string;
  language: string;
  totalStars: number;
  totalIssues: number;
  totalForks: number;
  contributors: number;
  lastWeekStars: number;
  tags: string[];
  license: string;
  relatedUrls: relatedUrl[];
}
