document.addEventListener('DOMContentLoaded', () => {
    // Add CSS styles for voted buttons with !important
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .voted-up { 
        background-color: #e6f7e6 !important; 
        font-weight: bold !important;
      }
      .voted-down { 
        background-color: #ffebeb !important;
        font-weight: bold !important; 
      }
    `;
    document.head.appendChild(styleElement);
    
    const voteButtons = document.querySelectorAll('.vote-btn');
    voteButtons.forEach(button => {
      button.addEventListener('click', async (event) => {
        const commentId = button.getAttribute('data-comment-id');
        const userId = button.getAttribute('data-user-id');
        const voteType = button.getAttribute('data-vote-type');
        
        try {
          const response = await fetch(`/comments/${commentId}/${voteType}/${userId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Vote response data:', data); // Debug output
            
            const scoreElement = document.getElementById(`score-${commentId}`);
            scoreElement.textContent = data.score;
            
            // Update button classes
            const upvoteBtn = document.querySelector(
              `.vote-btn[data-comment-id="${commentId}"][data-vote-type="upvote"]`
            );
            const downvoteBtn = document.querySelector(
              `.vote-btn[data-comment-id="${commentId}"][data-vote-type="downvote"]`
            );
            
            // Remove existing vote classes
            upvoteBtn.classList.remove('voted-up');
            downvoteBtn.classList.remove('voted-down');
            
            // Add class based on new vote
            if (data.userVote === 1) {
              upvoteBtn.classList.add('voted-up');
            } else if (data.userVote === -1) {
              downvoteBtn.classList.add('voted-down');
            }
          } else {
            console.error('Error in voting:', response.statusText);
          }
        } catch (error) {
          console.error('Error in voting:', error);
        }
      });
    });
  });