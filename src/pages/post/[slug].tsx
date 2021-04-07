/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';
import format from 'date-fns/format';
import ptBR from 'date-fns/locale/pt-BR';

import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
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
}

interface FormatReadingTime {
  heading: string;
  body: {
    text: string;
  }[];
}

export default function Post({ post }: PostProps): JSX.Element {
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
            <span>4 min</span>
          </div>
        </div>

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

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  return {
    props: {
      post: response,
    },
  };
};
