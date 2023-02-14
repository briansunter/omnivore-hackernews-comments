import { createArticle } from "./omnivore";

interface HNComment {
  id: number;
  text: string;
  by: string;
  childComments: HNComment[];
}

interface Story {
  id: number;
  by: string;
  title: string;
  score: number;
  url?: string;
  text?: string;
  time: number;
}

async function getStory(storyId: number): Promise<Story> {
  const storyResponse = await fetch(
    `https://hacker-news.firebaseio.com/v0/item/${storyId}.json`
  );
  return await storyResponse.json();
}

async function getComment(id: number): Promise<HNComment> {
  const commentResponse = await fetch(
    `https://hacker-news.firebaseio.com/v0/item/${id}.json`
  );

  const commentData = await commentResponse.json();

  const { text, by, kids } = commentData;
  if (!kids || !kids.length) {
    return { id, by, text, childComments: [] };
  }

  const childCommentRequests = kids.map((childId: number) =>
    getComment(childId)
  );
  const childComments = await Promise.all(childCommentRequests);

  return { id, text, by, childComments };
}

async function getAllComments(storyId: number): Promise<HNComment[]> {
  const storyResponse = await fetch(
    `https://hacker-news.firebaseio.com/v0/item/${storyId}.json`
  );
  const storyData = await storyResponse.json();

  const commentIds = storyData.kids;
  if (!commentIds || !commentIds.length) {
    return [];
  }

  const commentRequests = commentIds.map((commentId: number) =>
    getComment(commentId)
  );

  return Promise.all(commentRequests);
}

function formatComments(comments: HNComment[], level = 0) {
  let formattedComments = "";
  for (const comment of comments) {
    formattedComments += `<li>${comment.by} - ${comment.text}`;
    if (comment.childComments) {
      formattedComments += `<ul>${formatComments(
        comment.childComments,
        level + 1
      )}</ul>`;
    }
    formattedComments += "</li>\n";
  }
  return formattedComments;
}

function formatStory(story: Story, comments: HNComment[]) {
  return `
        <h1>${story.title}</h1>
        <p>HN Link: <a href="https://news.ycombinator.com/item?id=${
          story.id
        }">https://news.ycombinator.com/item?id=${story.id}</a></p>
        <p>By ${story.by}</p>
        <p>Score ${story.score}</p>
        <p>${story.text || story.url}</p>
        <h2>Comments</h2>
          ${formatComments(comments)}
    `;
}

function wrapHtml(html: string) {
  return `
    <html>
      <body>
        ${html}
      </body>
    </html>
  `;
}
async function run(storyId: number, auth: string) {
  // const comments = await getAllComments(7566069);
  const story = await getStory(storyId);
  const comments = await getAllComments(storyId);
  const formatted = formatStory(story, comments);
  await createArticle(
    {
      url: `https://news.ycombinator.com/item?id=${storyId}`,
      source: "Hackernews",
      preparedDocument: {
        document: `${wrapHtml(formatted)}`,
        pageInfo: {
          contentType: "text/html",
          title: `${story.title}`,
          author: story.by,
          publishedAt: story.time.toString(),
        },
      },
    },
    auth
  );
}
export { run };
