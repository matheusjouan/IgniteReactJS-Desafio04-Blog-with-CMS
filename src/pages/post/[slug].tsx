/* eslint-disable react/no-danger */
import next, { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';
import format from 'date-fns/format';
import ptBR from 'date-fns/locale/pt-BR';

import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Comments from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  uid?: string;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  nextPost: Post | undefined;
  prevPost: Post | undefined;
  preview: boolean;
}

export default function Post({
  post,
  nextPost,
  prevPost,
  preview,
}: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <p>Carregando...</p>;
  }

  const totalTime = post.data.content.reduce((acc, content) => {
    const totalBody = RichText.asText(content.body).split(' ').length;
    const totalHeading = content.heading.split(' ').length;

    const total = totalBody + totalHeading + acc;

    const min = Math.ceil(total / 200);
    return min;
  }, 0);

  const formatTitlePagination = (title): string => {
    const auxTitle = title.split(' ', 3);
    const newTitle = auxTitle.join(' ').substring(0, 20).concat('...');
    return newTitle;
  };

  return (
    <>
      <Header />
      <img src={post.data.banner.url} alt="banner" className={styles.banner} />
      <main className={styles.containerPost}>
        <h1>{post.data.title}</h1>
        <div className={styles.infoPost}>
          <div>
            <FiCalendar />
            <span>
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </span>
          </div>

          <div>
            <FiUser />
            <span>{post.data.author}</span>
          </div>

          <div>
            <FiClock />
            <span>{totalTime} min</span>
          </div>
        </div>

        {post.last_publication_date !== post.first_publication_date && (
          <span className={styles.updatedPost}>
            * editado em{' '}
            {format(
              new Date(post.last_publication_date),
              "dd MMM' 'yyyy', às 'HH:mm",
              {
                locale: ptBR,
              }
            )}
          </span>
        )}

        <section className={styles.post}>
          {post.data.content.map(content => (
            <div className={styles.postSection} key={content.heading}>
              <h2>{content.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </section>

        <div className={styles.postPagination}>
          {nextPost && (
            <div className={styles.nextPost}>
              <p>{formatTitlePagination(nextPost.data.title)}</p>
              <Link href={`/post/${nextPost.uid}`}>Post anterior</Link>
            </div>
          )}

          {prevPost && (
            <div className={styles.prevPost}>
              <p>{formatTitlePagination(prevPost.data.title)}</p>
              <Link href={`/post/${prevPost.uid}`}>Próximo Post</Link>
            </div>
          )}
        </div>

        <Comments />

        {preview && (
          <aside className={styles.buttonModePreview}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.predicates.at('document.type', 'posts')
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date]',
    }
  );

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date desc]',
    }
  );

  return {
    props: {
      post: response,
      nextPost: nextPost.results[0] || null,
      prevPost: prevPost.results[0] || null,
      preview,
    },
  };
};
