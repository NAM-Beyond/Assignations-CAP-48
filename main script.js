const Mois = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]
const ListeAssignables = JSON.parse(data).assignables.sort();
const ListeDispensesNuit = JSON.parse(data).dispensesnuit.sort();
const ListeExemptes = JSON.parse(data).exemptes.sort();
var ListeDispenses = [];
var ListeDesignables = [];
var ListeGarde = [];
window.onload = async function loaded() {
	ListeDesignables = ListeAssignables;
	DrawList("assignables", ListeDesignables);
	ListeDispenses = ListeExemptes.concat(ListeDispensesNuit).sort();
	DrawList("dispensés", ListeDispenses);
// On utilise un fetch en passant par l'API Open Source 'All Origins' qui permet de contourner les barrières de CORS policy empêchant l'accès aux données du tableau de garde car issues d'un autre domaine
	const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://app.planning.lifen.health/external/plannings/7b11e9c83c58a23dd848#planning')}`);
	const data = await response.json();
	document.getElementById("Frame").innerHTML = data.contents;
	document.getElementById("Frame").innerHTML = document.getElementById("planning").innerHTML.replace(/[\n\t]/g, "").replace(/(^\s+|(?<=[>])\s+(?=[<]))/g, "");
	ListeGarde = Array.from(document.getElementsByClassName("month-table")).map(a => a.innerText.split(/\n/)).map(b => b.map(c => c.replace(/\t/g, " ").replace(/( [éA-Z]\.| lun| mar| mer| jeu| ven| sam| dim| AM Samedi| Nuit| Jour Dim et JF)/g, "")));
	ListeGarde = ListeGarde.map((d, e) => d.map((f, g) => f = (f[0] == ' ') ? (isNaN(parseInt(ListeGarde[e][g - 1][1])) ? ListeGarde[e][g - 1][0] + f.substring(1, f.length) : ListeGarde[e][g - 1][0] + ListeGarde[e][g - 1][1] + " " + f.substring(2, f.length)) : f));
	ListeGarde = ListeGarde.map(h => h.map(i => i = (i[1] == ' ') ? "0" + i[0] + i.substring(1, i.length) : i));
}
function DrawList(id, Liste) {
	document.getElementById(id).innerHTML = "<b><u>Médecins " + id + "</u> :</b><br>";
	for (j = 0; j < Liste.length; j++) {
		NewElement = document.createElement("span");
		NewElement.innerHTML = Liste[j] + (j == Liste.length - 1 ? "" : "<br>");
		document.getElementById(id).appendChild(NewElement);
	}
}
// Fonction qui se déclenche lorsqu'on modifie la date et l'horaire (Jour / Nuit) de garde à assigner
function UpdateList(JourNuit, Date = 0) {
	// On vérifie s'il y a une mise à jour à faire sur les liste en cas de garde jour ou de nuit
	ListeDesignables = (JourNuit == "jour") ? ListeAssignables.concat(ListeDispensesNuit).sort() : ListeAssignables;
	ListeDispenses = (JourNuit == "jour") ? ListeExemptes : ListeExemptes.concat(ListeDispensesNuit).sort();
	// Puis on les affiche de nouveau avec la fonction habituelle
	DrawList("assignables", ListeDesignables);
	DrawList("dispensés", ListeDispenses);
	// Si une date a été sélectionnée, il va falloir vérifier sur le tableau de garde quels sont les médecins à retirer de la liste des assignables (par défaut le jour même, les 3 jours précédents et les 3 jours suivants)
	if (Date != 0) {
		// On récupère la date sélectionnée dans le champ de choix de date et on récupère le mois et le jour dans un tableau
		var Date = document.getElementById("Date").value.split(/-/).slice(1, 3);
		for (k = 0; k < ListeGarde.length; k++) {
			// On repère dans quel sous-tableau (mois) se trouve cette garde (on pourrait le définir nominativement mais le tableau change tous les 4 mois, les mois du tableau également, on s'assure que cela fonctionnera tout le temps)
			if (ListeGarde[k][0] == Mois[Date[0] - 1]) {
				for (l = 1; l < ListeGarde[k].length; l ++) {
					// On repère à quel rang (jour) se situe la garde afin de commencer à récupérer les noms des médecins à retirer de la liste des assignables
					if (parseInt(ListeGarde[k][l].slice(0,2)) == parseInt(Date[1])) {
						Extraire(k, l, 4, 1);
						Extraire(k, l - 1, 3, -1);
						break;
					}
				}
			}
		}
	}
}
function Extraire(MoisCourant, JourCourant, RangLimite, Sens) {
	for (m = 0; m < RangLimite; m ++) {
		if ([0, ListeGarde[MoisCourant].length].indexOf(JourCourant + m * Sens) > -1) {
			MoisCourant += Sens;
			JourCourant = (JourCourant + m * Sens == 0) ? ListeGarde[MoisCourant].length - 1 : 1;
			RangLimite -= m;
			m = 0;
		}
		if (ListeGarde[MoisCourant][JourCourant + m * Sens].split(/(?<=[0-9]) (?=[A-Z])/)[0] == ListeGarde[MoisCourant][JourCourant + m * Sens - 1].split(/(?<=[0-9]) (?=[A-Z])/)[0]) {
			RangLimite += 1;
		}
		console.log("Rang : ", ListeGarde[MoisCourant][JourCourant + m * Sens]);
	}
}
function Assigner() {
	document.getElementById("Gagnant").innerHTML = "<b><u>Médecin désigné</u> :</b><br>";
	MedecinDesigne = document.createElement("span");
	MedecinDesigne.innerHTML = ListeDesignables[Math.floor(Math.random() * ListeDesignables.length)];
	document.getElementById("Gagnant").appendChild(MedecinDesigne);
}