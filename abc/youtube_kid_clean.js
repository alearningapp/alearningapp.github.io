const Subscriptions = [];
let isParentMode = false;

const SubscriptionsName = "Subscriptions";
let parent = $(
  '<div style="position:fixed;top:0;cursor:pointer;right:10px;z-index:10000;background:white;"></div>'
).appendTo("body");
let parentToggle = $('<div style="background:red;">Parent</div>').appendTo(
  parent
);
let subscriptionsList = $(
  '<ul style="max-height: calc(100vh - 60px);list-style-type: none;overflow:auto;"/>'
)
  .appendTo(parent)
  .hide();

parent
  .on("mouseenter", () => {
    subscriptionsList.show();
  })
  .on("mouseleave", () => {
    subscriptionsList.hide();
  });
$("body").on("dblclick", function (event) {
  if (!isParentMode) return;
  let row = event.target.closest("ytd-video-renderer");
  if (row) {
    let userLink = $(row).find("#channel-thumbnail").attr("href");
    toggleUserLink(userLink);
    $(row).css(
      "background",
      Subscriptions.indexOf(userLink) > -1 ? "green" : "red"
    );
    saveSubscriptions();
  }
});

parentToggle.click(() => {
  if (!isParentMode) {
    if (window.prompt("parent password") == "abc") {
      isParentMode = !isParentMode;
      setTimeout(() => {
        isParentMode = false;
        parentToggle.css("background-color", !isParentMode ? "red" : "green");
      }, 5 * 60 * 1000);
    }
  } else if (isParentMode && location.href.indexOf("/watch") == -1) {
    isParentMode = !isParentMode;
  }

  if (isParentMode && location.href.indexOf("/watch") > -1) {
    let userLink = $('#owner a').attr('href');
    toggleUserLink(userLink);
    $("#above-the-fold").css(
      "color",
      Subscriptions.indexOf(userLink) > -1 ? "green" : "red"
    );
    saveSubscriptions();
  }

  parentToggle.css("background-color", !isParentMode ? "red" : "green");
});

function toggleUserLink(userLink) {
  let existIndex = Subscriptions.indexOf(userLink);
  if (existIndex > -1) {
    do {
      Subscriptions.splice(existIndex, 1);
      existIndex = Subscriptions.indexOf(userLink);
    } while (existIndex > -1);
  } else {
    Subscriptions.push(userLink);
  }
}
function loadSubscriptions() {
  Subscriptions.push(
    ...(localStorage.getItem(SubscriptionsName)
      ? JSON.parse(localStorage.getItem(SubscriptionsName))
      : [])
  );
  subscriptionsList.empty();
  Subscriptions.map((e, i) => {
    subscriptionsList.append(
      `<li><a href="https://www.youtube.com${e}">${i + 1},${e}</a></li>`
    );
  });
}
function saveSubscriptions() {
  Subscriptions.sort();
  localStorage.setItem(SubscriptionsName, JSON.stringify(Subscriptions));
  subscriptionsList.empty();
  Subscriptions.map((e, i) => {
    subscriptionsList.append(
      `<li><a href="https://www.youtube.com${e}">${i + 1},${e}</a></li>`
    );
  });
}

loadSubscriptions();

function clean() {
  {
    $("ytd-video-renderer").each(function () {
      let userLink = $(this).find("#channel-thumbnail").attr("href");
      $(this).css(
        "background",
        Subscriptions.indexOf(userLink) > -1 ? "green" : "red"
      );
    });
  }
  let firsturl = "https://www.youtube.com/results?search_query=kids";
  $("ytd-guide-section-renderer").each(function () {
    let html = $(this).html();
    (html.indexOf("Gaming") > -1 || html.indexOf("More from YouTube") > -1) &&
      $(this).css("display", "none");
  });
  //remove shorts video
  $("ytd-video-renderer").each(function () {
    $(this).html().indexOf("/shorts/") > -1 && $(this).remove();
  });

  console.error("load");

  if (
    location.href.toLowerCase().indexOf("gaming") > -1 ||
    location.href.indexOf("/watch?v=") > -1
  ) {
    let pass = Subscriptions.length == 0;
    if (Subscriptions.length > 0) {
      let text = $('#owner a').attr('href');
      if (!text) pass = 1;
      else
        for (let i = 0; i < Subscriptions.length; i++) {
          pass = Subscriptions.indexOf($('#owner a').attr('href')) > -1;
          if (pass) {
            localStorage.lasturl = location.href;
            $("#above-the-fold").css("color", "green");
            break;
          }
        }

      //subscriptions
    }
    if (!pass) {
      console.error($(".ytd-watch-metadata").html(), "redirect");
      $("ytd-app").css("background-color", "black");
      setTimeout(() => {
        //location.href = "https://www.youtube.com/";
        if (isParentMode) return;
        location.href = localStorage.lasturl || firsturl;
      }, 5000);
    }
  }

  $("ytd-reel-shelf-renderer,ytd-rich-shelf-renderer").each(function () {
    $(this).html().indexOf("Short") > -1 && $(this).remove();
  });

  $('a:contains("Shorts")').remove();
}

clean();

window.addEventListener("scroll", function () {
  setTimeout(clean, 1000);
  setTimeout(clean, 10000);
});

/*
//fullscreen
setTimeout(() => {
  try {
    console.log('fullscreen');
    $('.ytp-fullscreen-button.ytp-button').click();
    $("video")[0].requestFullscreen();
  } catch (ee) {
    console.log(ee)
  }
}, 10000)
*/
