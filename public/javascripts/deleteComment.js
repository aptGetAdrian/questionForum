document.addEventListener('DOMContentLoaded', () => {
    const deleteButtons = document.querySelectorAll('.delete-btn');

    deleteButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            event.preventDefault(); // Prevent default form submission if inside a form
            const commentId = button.getAttribute('data-comment-id');

            try {
                const response = await fetch(`/comments/${commentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                if (response.ok) {
                    // Remove the comment element from the DOM
                    const commentElement = document.getElementById(`comment-${commentId}`);
                    if (commentElement) {
                        commentElement.remove();
                    }
                } else {
                    console.error('Error deleting comment:', response.statusText);
                }
            } catch (error) {
                console.error('Error deleting comment:', error);
            }
        });
    });
});