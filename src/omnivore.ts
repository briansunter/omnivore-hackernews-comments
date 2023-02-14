import { GraphQLClient, gql } from "graphql-request";
interface PageInfoInput {
  title: string;
  author: string;
  description?: string;
  previewImage?: string;
  canonicalUrl?: string;
  publishedAt: string;
  contentType: string;
}

interface PreparedDocumentInput {
  document: string;
  pageInfo: PageInfoInput;
}

interface CreateArticleInput {
  url: string;
  preparedDocument?: PreparedDocumentInput;
  articleSavingRequestId?: string;
  uploadFileId?: string;
  skipParsing?: boolean;
  source?: string;
}
const OMNIVORE_API_URL = "https://api-prod.omnivore.app/api/graphql";

const createArticleMutation = gql`
  mutation createArticle($input: CreateArticleInput!) {
    createArticle(input: $input) {
      ... on CreateArticleSuccess {
        createdArticle {
          id
          title
          content
          isArchived
        }
        user {
          id
          name
        }
        created
      }
      ... on CreateArticleError {
        errorCodes
      }
    }
  }
`;

const searchArticlesQuery = gql`
  query searchArticles($query: String!) {
    search(first: 10, query: $query) {
      ... on SearchSuccess {
        edges {
          node {
            id
            url
          }
        }
        pageInfo {
          totalCount
        }
      }
      ... on SearchError {
        errorCodes
      }
    }
  }
`;

export async function createArticle(entry: CreateArticleInput, auth: string) {
  const client = new GraphQLClient(OMNIVORE_API_URL, {
    fetch: fetch,
    headers: {
      "Content-Type": `application/json`,
      Cookie: `auth=${auth}`,
    },
  });
  return await client.request(createArticleMutation, { input: entry });
}

export async function searchArticles(query: string, auth: string) {
  const client = new GraphQLClient(OMNIVORE_API_URL, {
    fetch: fetch,
    headers: {
      "Content-Type": `application/json`,
      Cookie: `auth=${auth}`,
    },
  });
  return await client.request(searchArticlesQuery, { query });
}

export async function hasSavedArticle(query: string, auth: string) {
  const result = await searchArticles(query, auth);
  if (result.search.pageInfo.totalCount > 0) {
    return true;
  }
  return false;
}
