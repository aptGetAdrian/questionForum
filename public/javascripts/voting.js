document.addEventListener('DOMContentLoaded', () => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .voted-up { 
        background-color:rgb(21, 135, 21) !important; 
        font-weight: bold !important;
        color: white;
        border-radius: 25px;
      }
      .voted-down { 
        background-color:rgb(132, 59, 59) !important;
        color: white;
        font-weight: bold !important; 
        border-radius: 25px;
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
            console.log('Vote response data:', data); 
            
            const scoreElement = document.getElementById(`score-${commentId}`);
            scoreElement.textContent = "Score: " + data.score;
            
            const upvoteBtn = document.querySelector(
              `.vote-btn[data-comment-id="${commentId}"][data-vote-type="upvote"]`
            );
            const downvoteBtn = document.querySelector(
              `.vote-btn[data-comment-id="${commentId}"][data-vote-type="downvote"]`
            );
            
            upvoteBtn.classList.remove('voted-up');
            downvoteBtn.classList.remove('voted-down');
            
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