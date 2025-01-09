document.addEventListener('DOMContentLoaded', function() {
    const shareTripStatusLink = document.getElementById('shareTripStatusLink');
    const shareTripStatusModal = document.getElementById('shareTripStatusModal');
    const closeModalButton = document.getElementById('closeModalButton');

    if(shareTripStatusLink && shareTripStatusModal) {
        shareTripStatusLink.addEventListener('click', function(event) {
            event.preventDefault();
            shareTripStatusModal.classList.remove('hidden');
        });
    }
    if(closeModalButton){
        closeModalButton.addEventListener('click', function(event) {
            event.preventDefault();
            shareTripStatusModal.classList.add('hidden');
        });
    }
    else{
        console.error('no closeModalButton');
    }
});