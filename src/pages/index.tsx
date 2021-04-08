import { GetStaticProps } from 'next';

import Head from 'next/head';
import Prismic from '@prismicio/client';

import Link from 'next/link';

import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useCallback, useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string>(postsPagination.next_page);

  console.log(preview);

  const handleLoadMorePost = useCallback(async () => {
    try {
      console.log(nextPage);

      const response = await fetch(nextPage);
      const data = await response.json();

      const newPosts = data.results.map((post: Post) => {
        return {
          uid: post.uid,
          first_publication_date: post.first_publication_date,
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.author,
          },
        };
      });
      setPosts([...posts, ...newPosts]);
      setNextPage(data.next_page);
    } catch {
      console.log('Erro');
    }
  }, [nextPage, posts]);

  return (
    <>
      <Head>
        <title>Blogs | Ignite</title>
      </Head>

      <main className={commonStyles.container}>
        <img src="logo.svg" alt="logo" className={styles.logoImg} />

        <div className={styles.posts}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <div className={styles.post}>
                  <h1>{post.data.title}</h1>
                  <h4>{post.data.subtitle}</h4>
                  <div className={styles.containerInfo}>
                    <div className={styles.containerInfoDescription}>
                      <FiCalendar />
                      <span>
                        {format(
                          new Date(post.first_publication_date),
                          'dd MMM yyy',
                          {
                            locale: ptBR,
                          }
                        )}
                      </span>
                    </div>

                    <div className={styles.containerInfoDescription}>
                      <FiUser />
                      <span>{post.data.author}</span>
                    </div>
                  </div>
                </div>
              </a>
            </Link>
          ))}

          {nextPage && (
            <button type="button" onClick={handleLoadMorePost}>
              Carregar mais posts
            </button>
          )}
        </div>

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

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 2,
      orderings: '[document.last_publication_date desc]',
      ref: previewData?.ref ?? null,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  console.log(postsResponse.next_page);

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page,
      },
      preview,
    },
    revalidate: 60 * 30,
  };
};
