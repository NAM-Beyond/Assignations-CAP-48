// Mise en places des variables globales qui vont être utilisés à plusieurs reprises dans les différentes fonctions
// On crée une liste de mois car le tableau de garde récupéré sur le site contient des mois affichés en toute lettre
const Mois = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]
var ListeAssignables = JSON.parse(data).assignables.sort();
var ListeExemptes = JSON.parse(data).exemptes.sort();
var ListeDispensesNuit = JSON.parse(data).dispensesnuit.sort();
var ListeDispenses = [];
var ListeTempDispenses = [];
var ListeGarde = [];
// Nécessité d'une fonction asyncrone car on utilise un fetch pour aller chercher le tableau de garde actualisé sur Lifen
window.onload = async function loaded() {
	// 2 listes différentes, ListeDesignables tiendra compte du retrait des personnes de gardes les jours autour de la date à désignées, si changement de date, la liste sera correctement mise à jour avec ListeAssignables qui n'aura pas été modifiée par le choix de jour
	DrawList("assignables", ListeAssignables);
	// On utilise un Set pour éliminer les doublons de noms
	ListeDispenses = Array.from(new Set(ListeExemptes.concat(ListeDispensesNuit).sort()));
	DrawList("dispensés", ListeDispenses);
	// On utilise un fetch en passant par l'API Open Source 'All Origins' qui permet de contourner les barrières de CORS policy empêchant l'accès aux données du tableau de garde car issues d'un autre domaine
	const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://app.planning.lifen.health/external/plannings/7b11e9c83c58a23dd848#planning')}`);
	const data = await response.json();
	document.getElementById("Frame").innerHTML = data.contents;
	document.getElementById("Frame").innerHTML = document.getElementById("planning").innerHTML.replace(/[\n\t]/g, "").replace(/(^\s+|(?<=[>])\s+(?=[<]))/g, "");
	ListeGarde = Array.from(document.getElementsByClassName("month-table")).map(a => a.innerText.split(/\n/)).map(b => b.map(c => c.replace(/\t/g, " ").replace(/( [éA-Z]\.| lun| mar| mer| jeu| ven| sam| dim| AM Samedi| Nuit| Jour Dim et JF)/g, "")));
	ListeGarde = ListeGarde.map((d, e) => d.map((f, g) => f = (f[0] == ' ') ? (isNaN(parseInt(ListeGarde[e][g - 1][1])) ? ListeGarde[e][g - 1][0] + f.substring(1, f.length) : ListeGarde[e][g - 1][0] + ListeGarde[e][g - 1][1] + " " + f.substring(2, f.length)) : f));
	ListeGarde = ListeGarde.map(h => h.map(i => i = (i[1] == ' ') ? "0" + i[0] + i.substring(1, i.length) : i));
	document.getElementById("Frame").innerHTML = "";
}
function DrawList(id, Liste) {
	document.getElementById(id).innerHTML = "<b><u>Médecins " + id + "</u> :</b><br>";
	for (j = 0; j < Liste.length; j++) {
		NewElement = document.createElement("span");
		NewElement.innerHTML = Liste[j];
		NewElement.id = Liste[j];
		NewElement.setAttribute("onclick", "Retirer('" + Liste[j] + "', " + id + ")");
		document.getElementById(id).appendChild(NewElement);
		br = document.createElement("br");
		document.getElementById(id).appendChild(br);
	}
}
// Fonction qui se déclenche lorsqu'on modifie la date et l'horaire (Jour / Nuit) de garde à assigner
function UpdateJour() {
	if (JourNuit.value == "jour") {
		ListeAssignables = ListeAssignables.concat(ListeDispensesNuit.filter(item => !ListeExemptes.includes(item) && !ListeTempDispenses.includes(item))).sort();
		ListeDispenses = ListeDispenses.filter(item => !ListeDispensesNuit.filter(name => !ListeExemptes.includes(name) && !ListeTempDispenses.includes(name)).includes(item));
	}
	else {
		ListeAssignables = ListeAssignables.filter(item => !ListeDispensesNuit.includes(item));
		ListeDispenses = Array.from(new Set(ListeDispenses.concat(ListeDispensesNuit))).sort();
	}
	// Puis on les affiche de nouveau avec la fonction habituelle
	DrawList("assignables", ListeAssignables);
	DrawList("dispensés", ListeDispenses);
	// Si une date a été sélectionnée, il va falloir vérifier sur le tableau de garde quels sont les médecins à retirer de la liste des assignables (par défaut le jour même, les 3 jours précédents et les 3 jours suivants)
}
function UpdateDate() {
	ListeAssignables = ListeAssignables.concat(ListeTempDispenses.filter(item => !ListeDispensesNuit.includes(item))).sort();
	ListeDispenses = ListeDispenses.filter(item => !ListeTempDispenses.filter(name => !ListeDispensesNuit.includes(name)).includes(item));
	ListeTempDispenses = [];
	// On récupère la date sélectionnée dans le champ de choix de date et on récupère le mois et le jour dans un tableau
	var Date = document.getElementById("Date").value.split(/-/).slice(1, 3);
	for (k = 0; k < ListeGarde.length; k++) {
		// On repère dans quel sous-tableau (mois) se trouve cette garde (on pourrait le définir nominativement mais le tableau change tous les 4 mois, les mois du tableau également, on s'assure que cela fonctionnera tout le temps)
		if (ListeGarde[k][0] == Mois[Date[0] - 1]) {
			for (l = 1; l < ListeGarde[k].length; l++) {
				// On repère à quel rang (jour) se situe la garde afin de commencer à récupérer les noms des médecins à retirer de la liste des assignables
				if (parseInt(ListeGarde[k][l].slice(0,2)) == parseInt(Date[1])) {
					// On renvoit à une fonction spécifique pour retirer de la liste les médecins de gardes le jour même ainsi que les 3 jours suivants ...
					Extraire(k, l, 5, 1);
					// Et les 3 jours précédents
					Extraire(k, l - 1, 4, -1);
					break;
				}
			}
		}
	}
	console.log("ListeTempDispenses est : ", ListeTempDispenses);
	ListeAssignables = ListeAssignables.filter(item => !ListeTempDispenses.includes(item));
	ListeDispenses = Array.from(new Set(ListeDispenses.concat(ListeTempDispenses))).sort();
	DrawList("assignables", ListeAssignables);
	DrawList("dispensés", ListeDispenses);
}
function Extraire(MoisCourant, JourCourant, RangLimite, Sens) {
	for (m = 0; m < RangLimite; m ++) {
		if ([0, ListeGarde[MoisCourant].length].indexOf(JourCourant + m * Sens) > -1) {
			// Cela signifie que l'on est arrivé en bout de mois, soit au début soit à la fin, il font donc basculer sur le mois suivant / précédent tout en conservant la progression déjà effectuée
			MoisCourant += Sens;
			JourCourant = (JourCourant + m * Sens == 0) ? ListeGarde[MoisCourant].length - 1 : 1;
			RangLimite -= m;
			m = 0;
		}
		if (ListeGarde[MoisCourant][JourCourant + m * Sens].split(/(?<=[0-9]) (?=[A-Z])/)[0] == ListeGarde[MoisCourant][JourCourant + m * Sens - 1].split(/(?<=[0-9]) (?=[A-Z])/)[0]) {
			// Cela signifie que l'on a deux gardes le même jour, donc avec le même numéro (Samedi, Dimanche et jours fériés), il font donc rajouter un cran de décompte pour passer au jour suivant et bien avoir 3 jours pris en compte
			RangLimite += 1;
		}
		console.log("On extrait la garde du ", ListeGarde[MoisCourant][JourCourant + m * Sens].split(/(?<=[0-9]) (?=[A-Z])/)[0], " effectuée par le Dr. ", ListeGarde[MoisCourant][JourCourant + m * Sens].split(/(?<=[0-9]) (?=[A-Z])/)[1]);
		if (!ListeExemptes.includes(ListeGarde[MoisCourant][JourCourant + m * Sens].split(/(?<=[0-9]) (?=[A-Z])/)[1])) {
			ListeTempDispenses.push(ListeGarde[MoisCourant][JourCourant + m * Sens].split(/(?<=[0-9]) (?=[A-Z])/)[1]);
		}
		else {
			console.log("Ah finalement pas, déjà exempté");
		}
	}
}
function Assigner() {
	document.getElementById("Gagnant").innerHTML = "<b><u>Médecin désigné</u> :</b><br>";
	MedecinDesigne = document.createElement("span");
	MedecinDesigne.innerHTML = ListeDesignables[Math.floor(Math.random() * ListeDesignables.length)];
	document.getElementById("Gagnant").appendChild(MedecinDesigne);
}
function Retirer(Medecin, liste) {
	let retirer = confirm("Voulez vous retirer le Dr. " + Medecin + " de la liste des " + liste.id + " ?");
	if (retirer) {
		switch (liste.id) {
			case "assignables":
				ListeDesignables.splice(ListeDesignables.indexOf(Medecin), 1);
				ListeExemptes.push(Medecin);
				ListeExemptes.sort();
				ListeDispenses = (JourNuit == "jour") ? ListeExemptes : Array.from(new Set(ListeExemptes.concat(ListeDispensesNuit).sort()));
				break;
			case "dispensés":
				ListeExemptes.splice(ListeExemptes.indexOf(Medecin), 1);
				ListeDispenses = (JourNuit.value == "jour") ? ListeExemptes : Array.from(new Set(ListeExemptes.concat(ListeDispensesNuit).sort()));
				if (!ListeDispenses.includes(Medecin)) {
					ListeDesignables.push(Medecin);
					ListeDesignables.sort();
				}
				break;
		}
		DrawList("assignables", ListeDesignables);
		DrawList("dispensés", ListeDispenses);
	}
}
