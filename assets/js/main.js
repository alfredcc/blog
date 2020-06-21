(() => {
  // Theme switch
  const body = document.body;
  const lamp = document.getElementById("mode");
  const data = body.getAttribute("data-theme");

  const initTheme = (state) => {
    if (state === "dark") {
      body.setAttribute("data-theme", "dark");
    } else if (state === "light") {
      body.removeAttribute("data-theme");
    } else {
      localStorage.setItem("theme", data);
    }
  };

  const toggleTheme = (state) => {
    var utterances = document.querySelector('iframe');
    if (state === "dark") {
      localStorage.setItem("theme", "light");
      body.removeAttribute("data-theme");
      utterances.contentWindow.postMessage(
        {type: 'set-theme',theme: 'github-light'}, 
        'https://utteranc.es'
      );
    } else if (state === "light") {
      localStorage.setItem("theme", "dark");
      body.setAttribute("data-theme", "dark");
      utterances.contentWindow.postMessage(
        {type: 'set-theme',theme: 'photon-dark'}, 
        'https://utteranc.es'
      );
    } else {
      initTheme(state);
    }
  };

  initTheme(localStorage.getItem("theme"));

  lamp.addEventListener("click", () =>
    toggleTheme(localStorage.getItem("theme"))
  );

  // Blur the content when the menu is open
  const cbox = document.getElementById("menu-trigger");

  cbox.addEventListener("change", function () {
    const area = document.querySelector(".wrapper");
    this.checked
      ? area.classList.add("blurry")
      : area.classList.remove("blurry");
  });
})();
