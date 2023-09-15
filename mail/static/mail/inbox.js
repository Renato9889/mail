document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_mail);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
  document.querySelector('#email-details').innerHTML = "";

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  document.querySelector('#email-details').innerHTML = "";
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;


  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      for(let i=0;i<emails.length;i++){
        const id = emails[i]['id'];
        const sender = emails[i]['sender'];
        const recipients = emails[i]['recipients'];
        const subject = emails[i]['subject'];
        const timestamp = emails[i]['timestamp'];
        const read = emails[i]['read'];

        const mail = document.createElement('div');
        mail.classList.add("details");

        if (read && mailbox !== 'sent') {
          mail.classList.add('unread-email');
        }

        mail.addEventListener('click', function() {
          view_mail(id);
        });
        
        
        if (mailbox === 'sent') {
          mail.innerHTML = `<div class="email-container"><span>${recipients}</span> <span>${subject}</span> <span>${timestamp}</span></div>`;
        } else {  
          mail.innerHTML = `<div class="email-container"><span>${sender}</span> <span>${subject}</span> <span>${timestamp}</span></div>`;
        }

        document.querySelector('#emails-view').append(mail);

      }
  });
}

function send_mail(event){

  event.preventDefault();

  const email_recipient = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const text_body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: email_recipient,
        subject: subject,
        body: text_body
    })
  })
  .then(response => response.json())
  .then(result => {
      load_mailbox('sent')
  });
}

function view_mail(id){
document.querySelector('#emails-view').style.display = 'none';
fetch(`/emails/${id}`)
.then(response => response.json())
.then(email => {
    const sender = email['sender'];
    const recipients = email['recipients'];
    const subject = email['subject'];
    const body = email['body'];
    const timestamp = email['timestamp'];
    const read = email['read'];
    const archived = email['archived'];

    
    const button_reply = document.createElement("button");

    button_reply.innerHTML = "Reply";
    button_reply.classList.add("btn","btn-light","btn-sm");

    button_reply.addEventListener('click', function(){
      mail_reply(email);
    });

    const button_archived = document.createElement("button");
    button_archived.classList.add("btn","btn-light","btn-sm");

    if (archived === false){
      button_archived.innerHTML = "Archive";
    }else{
      button_archived.innerHTML = "Unarchive";
    }

    button_archived.addEventListener('click', function(){
      mail_archive(id, archived);
    });

    const details = document.querySelector('#email-details');
    details.innerHTML = `<div class="details-container">
    <h5>${subject}</h5>
    <p>${body}</p>
    <p style="font-size:12px; font-weight: bold;">From:</span> ${sender}</p>
    <p style="font-size:12px; font-weight: bold;"><span>To:</span> ${recipients}</p>
    <p style="font-size:12px; font-weight: bold;"><span>Time:</span> ${timestamp}</p>
    </div>
    `;

    const user = document.querySelector('h2').innerHTML;
    if (user != sender) {
      details.appendChild(button_archived);
      details.appendChild(document.createTextNode(" "));
      details.appendChild(button_reply);
    }
    
    if (!read) {
      email_as_read(id);
    }
});
}
function email_as_read(id) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  });
}
function mail_archive(id, archived){
  if (archived === false) {
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: true
      })
    })
    .then(function() {
      load_mailbox('inbox')
    })
  } else {
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: false
      })
    })
    .then(function() {
      load_mailbox('inbox')
    })
  }
}

function mail_reply(email){
  compose_email();

  document.querySelector('#compose-recipients').value = email['sender'];

  if(email['subject'].startsWith('Re:')){
    document.querySelector('#compose-subject').value = email['subject'];
  }else{
    document.querySelector('#compose-subject').value = `Re: ${email['subject']}`;
  }

  document.querySelector('#compose-body').value = `On ${email['timestamp']}, ${email['sender']} wrote: ${email['body']}`;
}