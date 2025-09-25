import matter from "gray-matter";

type s = {
}

function setDefaultValues(
    defaultData: { [key: string]: any },
    data: { [key: string]: any },
) {
    return {
        
    }
}

export default function getYaml(fileContent: string) {
    const { data } : matter.GrayMatterFile<string> = matter(fileContent);

    return (
        setDefaultValues(
            data, 
            {
                hasTOC: true,
                TOCDepth: 2,
                isLandscape: false,
            }
        )
    )
}
