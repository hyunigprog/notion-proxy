import { Client } from '@notionhq/client';
import { Request, Response } from 'express';

const notionClient = new Client({
  auth: process.env.NOTION_API_KEY,
});

const notionDatabaseId = process.env.NOTION_DATABASE_ID || '';

export default async function handler(req: Request, res: Response) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  // 중요: 실제 프로덕션 환경에서는 '*' 대신 앱의 정확한 도메인을 적어주는 것이 안전합니다.
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 브라우저가 본 요청을 보내기 전에 보내는 '사전 요청(pre-flight request)'에 대한 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
    console.error('Notion API 키 또는 데이터베이스 ID가 환경 변수에 설정되지 않았습니다.');
    res.status(500).json({ error: '서버 설정에 오류가 있습니다.' });
    return;
  }

  try {
    const notionResponse = await notionClient.databases.query({
      database_id: notionDatabaseId,
    });

    // Notion API 응답을 프론트엔드에서 사용하기 좋은 형태로 가공합니다.
    const formattedData = notionResponse.results.map((page: any) => {
      const properties = page.properties;
      return {
        id: page.id,
        ticker: properties.ticker?.title[0]?.plain_text || null,
        date: properties.date?.date?.start || null,
        price: properties.price?.number || null,
        quantity: properties.quantity?.number || null,
        type: properties.type?.select?.name || null,
      };
    });

    res.status(200).json(formattedData);

  } catch (error) {
    console.error('Notion 데이터 조회 중 오류 발생:', error);
    res.status(500).json({ error: 'Notion에서 데이터를 가져오는 데 실패했습니다.' });
  }
}
