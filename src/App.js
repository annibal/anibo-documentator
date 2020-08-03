import React from 'react';
import AppMarkdown from "./Index.md";
import MarkdownLoader from "./MarkdownLoader";

function App() {
  return (
    <div className="App">
      <div className="container">
        <MarkdownLoader src={AppMarkdown} />
      </div>
    </div>
  );
}

export default App;
