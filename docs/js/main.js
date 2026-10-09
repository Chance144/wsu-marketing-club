(function () {
  "use strict";

  var PT = "America/Los_Angeles";
  var MEETING_ANCHOR = "2026-09-23";
  var MEETING_LAST = "2026-12-02";

  function ptISODate(date) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: PT,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date);
  }

  function parseISO(iso) {
    var parts = iso.split("-").map(Number);
    return Date.UTC(parts[0], parts[1] - 1, parts[2]);
  }

  function addDaysISO(iso, days) {
    var dt = new Date(parseISO(iso));
    dt.setUTCDate(dt.getUTCDate() + days);
    var y = dt.getUTCFullYear();
    var m = String(dt.getUTCMonth() + 1).padStart(2, "0");
    var d = String(dt.getUTCDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function formatLong(iso) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(new Date(parseISO(iso) + 12 * 60 * 60 * 1000));
  }

  function formatWeekday(iso) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      weekday: "long"
    }).format(new Date(parseISO(iso) + 12 * 60 * 60 * 1000));
  }

  function meetingDates() {
    var dates = [];
    var cursor = MEETING_ANCHOR;
    var guard = 0;
    while (cursor <= MEETING_LAST && guard < 30) {
      dates.push(cursor);
      cursor = addDaysISO(cursor, 14);
      guard += 1;
    }
    return dates;
  }

  function nextMeeting(todayISO) {
    var dates = meetingDates();
    for (var i = 0; i < dates.length; i += 1) {
      if (dates[i] >= todayISO) return dates[i];
    }
    return null;
  }

  function progressFor(todayISO, dates) {
    if (!dates.length) return 0;
    if (todayISO <= dates[0]) return 0;
    if (todayISO >= dates[dates.length - 1]) return 1;
    for (var i = 0; i < dates.length - 1; i += 1) {
      var a = dates[i];
      var b = dates[i + 1];
      if (todayISO >= a && todayISO <= b) {
        var span = (parseISO(b) - parseISO(a)) / 86400000;
        var into = (parseISO(todayISO) - parseISO(a)) / 86400000;
        var frac = span === 0 ? 0 : into / span;
        var start = i / (dates.length - 1);
        var end = (i + 1) / (dates.length - 1);
        return start + frac * (end - start);
      }
    }
    return 1;
  }

  function stateFor(iso, todayISO) {
    if (iso < todayISO) return "past";
    if (iso === todayISO) return "today";
    return "upcoming";
  }

  function stateLabel(state) {
    if (state === "past") return "Past";
    if (state === "today") return "Today";
    return "Upcoming";
  }

  function initNav() {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector("#site-nav");
    if (!header || !toggle || !nav) return;

    var label = toggle.querySelector(".nav-toggle-label");

    function closeMenu(restoreFocus) {
      header.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      if (label) label.textContent = "Menu";
      if (restoreFocus) toggle.focus();
    }

    function openMenu() {
      header.classList.add("is-open");
      document.body.classList.add("nav-open");
      toggle.setAttribute("aria-expanded", "true");
      if (label) label.textContent = "Close";
      var first = nav.querySelector("a");
      if (first) first.focus();
    }

    toggle.addEventListener("click", function () {
      if (header.classList.contains("is-open")) closeMenu(true);
      else openMenu();
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && header.classList.contains("is-open")) {
        closeMenu(true);
      }
    });

    var desktop = window.matchMedia("(min-width: 920px)");
    function onDesktop(event) {
      if (event.matches) closeMenu(false);
    }
    if (desktop.addEventListener) desktop.addEventListener("change", onDesktop);
    else if (desktop.addListener) desktop.addListener(onDesktop);

    var links = Array.prototype.slice.call(nav.querySelectorAll("a[href^='#']"));
    var sections = links
      .map(function (link) { return document.querySelector(link.getAttribute("href")); })
      .filter(Boolean);

    if ("IntersectionObserver" in window && sections.length) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            var on = link.getAttribute("href") === "#" + entry.target.id;
            link.classList.toggle("is-here", on);
            if (on) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          });
        });
      }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
      sections.forEach(function (section) { observer.observe(section); });
    }
  }

  function initScrollHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    function onScroll() {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initRoadmap(todayISO) {
    var root = document.getElementById("roadmap");
    var tabs = document.getElementById("roadmap-tabs");
    var todayLine = document.getElementById("roadmap-today");
    var panel = document.getElementById("session-panel");
    if (!root || !tabs || !panel) return;

    var buttons = Array.prototype.slice.call(tabs.querySelectorAll("[role='tab']"));
    var dates = buttons.map(function (button) { return button.getAttribute("data-date"); });
    var detailState = document.getElementById("detail-state");
    var detailName = document.getElementById("detail-name");
    var detailDate = document.getElementById("detail-date");
    var detailKind = document.getElementById("detail-kind");

    buttons.forEach(function (button) {
      var iso = button.getAttribute("data-date");
      var state = stateFor(iso, todayISO);
      button.setAttribute("data-state", state);
      var stateEl = button.querySelector(".state");
      if (stateEl) stateEl.textContent = stateLabel(state);
    });

    root.style.setProperty("--progress", String(progressFor(todayISO, dates)));
    root.classList.add("is-ready");

    var past = buttons.filter(function (button) { return button.getAttribute("data-state") === "past"; });
    var ahead = buttons.filter(function (button) {
      var state = button.getAttribute("data-state");
      return state === "upcoming" || state === "today";
    });
    var todayButton = buttons.filter(function (button) { return button.getAttribute("data-state") === "today"; })[0];

    if (todayLine) {
      var sentence = "Today is " + formatLong(todayISO) + ". ";
      if (todayButton) {
        sentence += todayButton.getAttribute("data-name") + " is on the roadmap today.";
      } else if (!past.length) {
        sentence += "Every date on this roadmap is still ahead. The first is " + buttons[0].getAttribute("data-name") + " on " + formatLong(dates[0]) + ".";
      } else if (!ahead.length) {
        sentence += "Every date on this roadmap has passed.";
      } else {
        var lastPast = past[past.length - 1];
        var nextUp = ahead[0];
        sentence += lastPast.getAttribute("data-name") + " on " + formatLong(lastPast.getAttribute("data-date")) + " has passed. Next up is " + nextUp.getAttribute("data-name") + " on " + formatLong(nextUp.getAttribute("data-date")) + ".";
      }
      todayLine.textContent = sentence;
    }

    function select(button, fromUser) {
      buttons.forEach(function (item) {
        var on = item === button;
        item.setAttribute("aria-selected", on ? "true" : "false");
        item.tabIndex = on ? 0 : -1;
      });
      panel.setAttribute("aria-labelledby", button.id);
      var iso = button.getAttribute("data-date");
      var kind = button.getAttribute("data-kind");
      var state = button.getAttribute("data-state");
      panel.classList.remove("is-past", "is-upcoming", "is-today");
      panel.classList.add(state === "past" ? "is-past" : state === "today" ? "is-today" : "is-upcoming");
      if (detailState) detailState.textContent = stateLabel(state);
      if (detailName) detailName.textContent = button.getAttribute("data-name");
      if (detailDate) detailDate.textContent = formatLong(iso);
      if (detailKind) {
        detailKind.textContent = kind === "finish"
          ? "Finish mark on the Fall 2026 roadmap. Not a company session."
          : "Company session on the Fall 2026 roadmap. No description is listed here.";
      }
      if (fromUser) panel.setAttribute("aria-live", "polite");
    }

    var initial = todayButton || ahead[0] || buttons[buttons.length - 1];
    if (initial) select(initial, false);

    buttons.forEach(function (button) {
      button.addEventListener("click", function () { select(button, true); });
    });

    tabs.addEventListener("keydown", function (event) {
      var current = document.activeElement;
      var index = buttons.indexOf(current);
      if (index < 0) return;
      var next = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % buttons.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + buttons.length) % buttons.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = buttons.length - 1;
      else return;
      event.preventDefault();
      buttons[next].focus();
      select(buttons[next], true);
    });
  }

  function initMeetings(todayISO) {
    var list = document.getElementById("meeting-dates");
    var kicker = document.getElementById("next-kicker");
    var dateEl = document.getElementById("next-date");
    var meta = document.getElementById("next-meta");
    var blurb = document.getElementById("next-meeting");
    var dates = meetingDates();
    var upcoming = nextMeeting(todayISO);

    if (list) {
      list.textContent = "";
      dates.forEach(function (iso) {
        var li = document.createElement("li");
        var time = document.createElement("time");
        time.dateTime = iso;
        time.textContent = formatLong(iso);
        var tag = document.createElement("span");
        tag.className = "when-state";
        var state = stateFor(iso, todayISO);
        tag.textContent = stateLabel(state);
        if (state === "past") li.classList.add("is-past");
        if (state === "today") li.classList.add("is-today");
        li.appendChild(time);
        li.appendChild(tag);
        list.appendChild(li);
      });
    }

    if (upcoming && dateEl && kicker) {
      var when = stateFor(upcoming, todayISO);
      kicker.textContent = when === "today" ? "Meeting today" : "Next meeting";
      dateEl.textContent = formatLong(upcoming);
      if (meta) meta.textContent = "4:00 p.m. Pacific · Spark 223";
      if (blurb) {
        blurb.textContent = when === "today"
          ? "The biweekly Wednesday in this calendar file is today, " + formatLong(upcoming) + ", at 4:00 p.m. Pacific in Spark 223."
          : "Next in this calendar file: " + formatWeekday(upcoming) + ", " + formatLong(upcoming).replace(/^\w+,\s/, "") + ", at 4:00 p.m. Pacific in Spark 223.";
      }
    } else if (dateEl && kicker) {
      kicker.textContent = "Fall 2026 series";
      dateEl.textContent = "No later date in this file";
      if (meta) meta.textContent = "The last biweekly Wednesday listed is December 2, 2026.";
      if (blurb) blurb.textContent = "Every Wednesday in the Fall 2026 calendar file is in the past. The standing note is still biweekly Wednesdays at 4:00 p.m. Pacific in Spark 223.";
    }
  }

  function initForm() {
    var form = document.getElementById("join-form");
    var message = document.getElementById("form-message");
    if (!form || !message) return;
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      message.textContent = "Placeholder only. Nothing was sent or saved. Club leadership still needs to connect a real signup.";
    });
  }

  function init() {
    var todayISO = ptISODate(new Date());
    document.documentElement.setAttribute("data-today", todayISO);
    initNav();
    initScrollHeader();
    initRoadmap(todayISO);
    initMeetings(todayISO);
    initForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
