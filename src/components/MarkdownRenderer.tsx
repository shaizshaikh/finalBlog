
"use client";

import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
// import { Button } from './ui/button'; // Button component not directly used here for copy
// import { Copy } from 'lucide-react'; // Icon not directly used here for copy
import { useToast } from '@/hooks/use-toast';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);

  const htmlContent = DOMPurify.sanitize(marked(content) as string);

  useEffect(() => {
    if (contentRef.current) {
      const codeBlocks = contentRef.current.querySelectorAll('pre');
      codeBlocks.forEach((block) => {
        const codeElement = block.querySelector('code');
        if (codeElement) {
          // Ensure only one button is added
          let copyButton = block.parentNode?.querySelector('.copy-code-button') as HTMLButtonElement | null;
          
          if (!copyButton) {
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';

            copyButton = document.createElement('button');
            // Using inline SVG for the copy icon to avoid dependency issues if lucide-react isn't available in this direct DOM manipulation context
            copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><title>Copy code</title><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>`;
            copyButton.className = 'copy-code-button absolute top-2 right-2 p-1.5 bg-muted text-muted-foreground hover:bg-secondary rounded-md transition-colors opacity-50 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring';
            copyButton.setAttribute('aria-label', 'Copy code to clipboard');
            
            block.parentNode?.insertBefore(wrapper, block);
            wrapper.appendChild(block); // Move the <pre> block inside the wrapper
            wrapper.appendChild(copyButton); // Append button to wrapper, not block
          }

          // Attach or re-attach onclick listener
          copyButton.onclick = () => { // Use fat arrow to ensure `toast` is in scope
            navigator.clipboard.writeText(codeElement.innerText)
              .then(() => {
                toast({ title: 'Copied!', description: 'Code snippet copied to clipboard.' });
              })
              .catch(err => {
                console.error('Failed to copy: ', err);
                toast({ title: 'Error', description: 'Failed to copy code.', variant: 'destructive' });
              });
          };
        }
      });
    }
  // Re-run when htmlContent changes, or toast function reference changes (though toast is stable from hook)
  }, [htmlContent, toast]);

  return (
    <div
      ref={contentRef}
      className="prose dark:prose-invert max-w-none prose-headings:font-headline prose-a:text-primary hover:prose-a:text-primary/80 prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:bg-muted prose-code:text-foreground prose-pre:bg-card prose-pre:border prose-pre:p-0 prose-pre:rounded-md" // prose-pre:p-0 to allow internal padding via wrapper if needed
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default MarkdownRenderer;
