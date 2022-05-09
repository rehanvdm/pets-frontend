import {Api} from "@rehanvdm/pets-api"

const apiBaseUrl = "<YOUR URL HERE - NO TRAILING SLASH>";
const api = new Api({
                    baseUrl: apiBaseUrl,
                    // baseApiParams: {
                    //   headers: {
                    //     "Authorization": "<YOUR TOKEN HERE>"
                    //   }
                    // }
                  });

async function index()
{
  const htmlConsole = (html: any) => document.getElementById("console")!.innerHTML =
                                            document.getElementById("console")!.innerHTML + html + "<br>";
  const formattedObj= (obj: any) => JSON.stringify(obj, null, 2);
  try
  {
    htmlConsole("await api.pets.getPets();");
    let pets = await api.pets.getPets();
    // pets.status
    htmlConsole(formattedObj(pets.data));

    htmlConsole("");

    htmlConsole("await api.pets.getPetById(1);");
    let pet = await api.pets.getPetById(1);
    htmlConsole(formattedObj(pet.data));
  }
  catch (err)
  {
    console.log("ERR", err, formattedObj(err));
    htmlConsole(err);
  }
}
index();
