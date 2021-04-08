import { createRef, useEffect } from 'react';

export default function Comments(): JSX.Element {
  const commentBox = createRef<HTMLDivElement>();
  // const utteranceTheme = theme.dark ? 'github-dark' : 'github-light';
  useEffect(() => {
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-comments-for-uterances');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', true);
    script.setAttribute(
      'repo',
      'matheusjouan/IgniteReactJS-Desafio04-Blog-with-CMS'
    );
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'github-dark');
    // anchor.appendChild(script);
    commentBox.current.appendChild(script);
  }, [commentBox]);

  return (
    <div className="comment-box-wrapper container pt-7">
      <div ref={commentBox} className="comment-box" />
      {/* Above element is where the comments are injected */}
    </div>
  );
}
