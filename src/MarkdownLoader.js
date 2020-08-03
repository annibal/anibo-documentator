import React, { useState, useEffect } from 'react'
import ReactMarkdown from "react-markdown";

export default function MarkdownLoader({ src }) {
    const [contents, setContents] = useState('');
    useEffect(() => {
        fetch(src)
            .then(res => res.text())
            .then(text => setContents(text))
    })

    if (contents === '')
        return contents;
    else
        return (<ReactMarkdown source={contents} />)
}
