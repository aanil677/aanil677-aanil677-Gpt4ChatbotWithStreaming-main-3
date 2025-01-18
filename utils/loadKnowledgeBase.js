export const loadKnowledgeBase = async () => {
    const response = await fetch('/data/knowledgebase.json');
    const data = await response.json();
    return data;
  };
  