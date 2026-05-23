const SITE_NAME = 'Booky Editing Services';

const setMeta = (name, content, attr = 'name') => {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

export const setSEO = ({ title, subtitle, description, keywords }) => {
  document.title = subtitle
    ? `${title} | ${subtitle} | ${SITE_NAME}`
    : `${title} | ${SITE_NAME}`;

  if (description) {
    setMeta('description', description);
    setMeta('og:description', description, 'property');
    setMeta('twitter:description', description);
  }

  if (keywords) {
    setMeta('keywords', keywords);
  }

  const ogTitle = subtitle ? `${title} | ${subtitle}` : title;
  setMeta('og:title', ogTitle, 'property');
  setMeta('twitter:title', ogTitle);
};
