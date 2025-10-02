// DOM Safety utilities to prevent removeChild errors in production
export const initializeDOMSafety = () => {
  if (typeof window === 'undefined') return;

  // Only apply in production or when specifically needed
  if (process.env.NODE_ENV === 'production') {
    // Override removeChild to prevent DOM manipulation errors
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function<T extends Node>(child: T): T {
      try {
        // Check if the child is actually a child of this node
        if (this.contains(child)) {
          return originalRemoveChild.call(this, child);
        } else {
          console.warn('DOM Safety: Attempting to remove child that is not present:', {
            parent: this,
            child: child,
            parentNodeName: this.nodeName,
            childNodeName: child.nodeName
          });
          return child;
        }
      } catch (error) {
        console.error('DOM Safety: Error in removeChild operation:', error, {
          parent: this,
          child: child
        });
        return child;
      }
    };

    // Override insertBefore to prevent similar issues
    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function<T extends Node>(newNode: T, referenceNode: Node | null): T {
      try {
        // If referenceNode is not null, check if it's actually a child
        if (referenceNode && !this.contains(referenceNode)) {
          console.warn('DOM Safety: Reference node is not a child, appending instead');
          return this.appendChild(newNode) as T;
        }
        return originalInsertBefore.call(this, newNode, referenceNode);
      } catch (error) {
        console.error('DOM Safety: Error in insertBefore operation:', error);
        // Fallback to appendChild
        try {
          return this.appendChild(newNode) as T;
        } catch (appendError) {
          console.error('DOM Safety: Fallback appendChild also failed:', appendError);
          return newNode;
        }
      }
    };

    // Override replaceChild to prevent issues
    const originalReplaceChild = Node.prototype.replaceChild;
    Node.prototype.replaceChild = function<T extends Node>(newChild: Node, oldChild: T): T {
      try {
        if (!this.contains(oldChild)) {
          console.warn('DOM Safety: Old child is not present, appending new child instead');
          this.appendChild(newChild);
          return oldChild;
        }
        return originalReplaceChild.call(this, newChild, oldChild);
      } catch (error) {
        console.error('DOM Safety: Error in replaceChild operation:', error);
        return oldChild;
      }
    };

    console.log('DOM Safety: Protection enabled for production');
  }
};