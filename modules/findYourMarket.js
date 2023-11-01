export function findYourMarket(){

  let html = `
  <div class="offcanvas offcanvas-top" tabindex="-1" id="offcanvasExample" aria-labelledby="offcanvasExampleLabel">
    <div class="offcanvas-header">
    <i class="fa-solid fa-bars"></i>
      <div class="input-box">
        <input type="text" class="form-control" placeholder="Input Text">             
    </div>
    <i class="fa fa-search"></i>   
  </div>
  <div class="offcanvas-body">
    <div class="fym-default-text">
    Dont see where you shop? <br>
    Ask them to join Markit
    </div>
  </div>
</div>`
   return html;

};